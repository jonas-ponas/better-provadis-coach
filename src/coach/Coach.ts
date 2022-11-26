/**
 * In Theory this library is working. It worked before...
 * But it currently doesn't work due to mysterious circumstances :(
 * Feel free to find the bug(?) ¯\_(ツ)_/¯
 */

import * as CryptoJS from 'crypto-js';

export default class Coach {
	private accessToken?: {expires: number; token: string};
	private coachToken?: {expires: number; token: string};
	private refreshToken?: {expires?: number; token: string};

	private userId: number = -1;
	private url: string = '';
	private domainId: number = -1;

	private clientId?: string;
	private clientSecret?: string;

	constructor(options: {
		token: string;
		expires: string;
		refreshToken: string;
		clientSecret: string;
		clientId: string;
		url?: string;
		userId?: string;
		domainId?: number;
	}) {
		this.accessToken = {
			token: options.token,
			expires: new Date(options.token).getTime()
		};
		this.refreshToken = {
			token: options.refreshToken
		};
		this.domainId = options.domainId || -1;

		this.clientId = options.clientId;
		this.clientSecret = options.clientSecret;

		console.debug('Initializing Coach...', {
			url: this.url,
			access_token: this.accessToken || {},
			refresh_token: this.refreshToken || {},
			domain_id: this.domainId,
			clientId: this.clientId,
			clientSecret: this.clientSecret
		});
	}

	public async getNewAccessToken() {
		console.log('Refreshing Token');
		const response = await fetch('https://hochschule.provadis-coach.de/oauth/token', {
			method: 'POST',
			headers: {
				'X-Requested-With': 'de.provadis.provadiscampus',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				refresh_token: this.refreshToken?.token,
				grant_type: 'refresh_token',
				client_id: this.clientId,
				client_secret: this.clientSecret
			})
		});
		if (response.status != 200) {
			try {
				const json = await response.json();
				throw new Error(`Request failed (${json['error']}: ${json['error_description']})`);
			} catch (e) {
				throw new Error('Request failed (' + response.statusText + ')');
			}
		}
		const json = (await response.json()) as any;
		console.log(json);
		if (!json['success']) throw new Error(`Could not retrieve new Access Token. (Returned success=false)`);
		this.accessToken = {
			token: json['access_token'],
			expires: Date.now() + json['expires_in']
		};
		this.refreshToken = {
			token: json['refresh_token']
		};
		console.debug('Updated Access- and Refresh-Token', this.accessToken, this.refreshToken);
	}

	public async getUserInfo() {
		console.log('Getting Oauth User-Info...');
		// await this.checkAccessToken()
		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.accessToken?.token || ''}`,
				'X-Requested-With': 'de.provadis.provadiscampus'
			},
			body: JSON.stringify({
				domain_id: this.domainId,
				client_verifier: CryptoJS.HmacSHA256(this.clientSecret || '', this.accessToken?.token || '').toString(),
				client_id: this.clientId || ''
			})
		};
		const response = await fetch('https://hochschule.provadis-coach.de/oauth/userinfo', options);

		if (response.status != 200) {
			try {
				const json = await response.json();
				throw new Error(`Request failed (${json['error']}: ${json['error_description']})`);
			} catch (e) {
				throw new Error('Request failed (' + response.statusText + ')');
			}
		}
		const json = await response.json();
    if(json.error) {
      throw new Error(`Request failed (${json['error']}: ${json['error_description']})`)
    }
		if (json.token?.access_token) {
			this.accessToken = {
				token: json.token?.access_token,
				expires: json.token?.expires
			};
			console.debug('Updated Access-Token', this.accessToken);
		}
		if (json?.token?.refresh_token) {
			this.refreshToken = {
				token: json.token?.refresh_token
			};
			console.debug('Updated Refresh-Token', this.refreshToken);
		}
    console.log(json);
		return json;
	}

	public async getResource() {
		await this.checkAccessToken();
		const response = await fetch(
			`https://hochschule.provadis-coach.de/oauth/resource?access_token=${this.accessToken?.token}`
		);
		if (response.status != 200) throw new Error(`Request was not successful (Response ${response.status})`);
		const json = (await response.json()) as any;
		if (!json['success']) throw new Error(`Request was not successful (success=false)`);
		this.coachToken = {
			token: json['coach']['login_token'] || '',
			expires: json['coach']['expires'] || 0
		};
		console.debug('Updated Coach-Login-Token: ', this.coachToken);
	}

	public async getFiles(): Promise<object[]> {
		console.debug('Getting Files...');
		await this.checkAccessToken();
		await this.checkCoachToken();

		const urlParams = this.generateUrlParams({
			client_id: this.clientId,
			domain_id: this.domainId,
			login_token: this.coachToken!!.token,
			scope: 'coach_session',
			timestamp: new Date().toISOString()
		});
		// console.debug('Generated URL-Parameters: ', urlParams);
		const response = await fetch('https://hochschule.provadis-coach.de/api/files/' + urlParams, {
			headers: {
				'X-Requested-With': 'de.provadis.provadiscampus'
			}
		});
		if (response.status != 200) {
			try {
				const json = await response.json();
				throw new Error(`Request failed (${json['error']}: ${json['error_description']})`);
			} catch (e) {
				throw new Error('Request failed (' + response.statusText + ')');
			}
		}
		const json = await response.json();
		if (!json['success']) {
			throw new Error('Request failed (success=false)');
		}
		console.debug('Received Files:', json.length);
		return json['data'];
	}

	public async getDirectories() {
		console.debug('Getting Directories...');
		await this.checkAccessToken();
		await this.checkCoachToken();

		const urlParams = this.generateUrlParams({
			client_id: this.clientId,
			domain_id: this.domainId,
			login_token: this.coachToken!!.token,
			scope: 'coach_session',
			timestamp: new Date().toISOString()
		});
		// console.debug('Generated URL-Parameters: ', urlParams);
		const response = await fetch('https://hochschule.provadis-coach.de/api/FilesDirTree/' + urlParams, {
			headers: {
				'X-Requested-With': 'de.provadis.provadiscampus'
			}
		});
		if (response.status != 200) {
			try {
				const json = await response.json();
				throw new Error(`Request failed (${json['error']}: ${json['error_description']})`);
			} catch (e) {
				throw new Error('Request failed (' + response.statusText + ')');
			}
		}
		const json = await response.json();
		if (!json['success']) {
			throw new Error('Request failed (success=false)');
		}
		return json['data'];
	}

  public async getNews() {
    console.debug('Getting News...');
		await this.checkAccessToken();
		await this.checkCoachToken();

		const urlParams = this.generateUrlParams({
			client_id: this.clientId,
			domain_id: this.domainId,
			login_token: this.coachToken!!.token,
			scope: 'coach_session',
			timestamp: new Date().toISOString()
		});
		// console.debug('Generated URL-Parameters: ', urlParams);
		const response = await fetch('https://hochschule.provadis-coach.de/api/news/' + urlParams, {
			headers: {
				'X-Requested-With': 'de.provadis.provadiscampus'
			}
		});
		if (response.status != 200) {
			try {
				const json = await response.json();
				throw new Error(`Request failed (${json['error']}: ${json['error_description']})`);
			} catch (e) {
				throw new Error('Request failed (' + response.statusText + ')');
			}
		}
		const json = await response.json();
		if (!json['success']) {
			throw new Error('Request failed (success=false)');
		}
		return json['data'];
  }

	public getFileStructure(): any {
		// TODO
		return [];
	}

	public static fromDatabase(): Coach {
		// TODO
		throw new Error();
	}

	public static async fromQrCode(qrcode: {
		token: string;
		expires: string;
		refreshToken: string;
		url?: string;
		userId?: string;
		domainId?: number;
	}, clientSecret: string, clientId: string): Promise<Coach> {
		let coach = new Coach({
			...qrcode, 
			clientSecret,
			clientId
		})
		const userInfo = await coach.getUserInfo()
		console.log("Got User-Info: ", userInfo.user.firstname + " " + userInfo.user.lastname)
		return coach
	}

	/* ----------------------------
      Below are Helper functions
     ----------------------------  */
	private async checkAccessToken() {
		if ((this.accessToken?.expires || 0) < Date.now()) {
			if ((this.refreshToken?.token || '') == '') {
				throw new Error('Refresh Token nicht verfügbar');
			}
			await this.getNewAccessToken();
		}
		return true;
	}

	private async checkCoachToken() {
		if ((this.coachToken?.expires || 0) < Date.now()) {
			console.debug('Getting new Coach-Login-Token...');
			await this.getResource();
		}
		return true;
	}

	private generateUrlParams(obj: object) {
		const generateParams = (obj: object, d1: string, d2: string) => {
			const encode = (s: string) =>
				encodeURIComponent(s)
					.replace(/[!'()]/g, escape)
					.replace(/\*/g, '%2A')
					.replace(/\%20/g, '+')
					.replace(/~/g, '%7E');
			return Object.entries(obj).reduce((p, [key, value], i, a) => {
				p += encode(key) + d1 + encode(value) + d2;
				return p;
			}, '');
		};
		const signatureString = generateParams(obj, '=', '&').slice(0, -1);
		const signature = CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(signatureString, this.accessToken!!.token));
		return (
			generateParams(obj, '/', '/') + 'signature/' + encodeURI(Buffer.from(signature, 'utf-8').toString('base64'))
		);
	}

	public dumpCurrentRefreshToken() {
		return this.refreshToken?.token;
	}
}

interface File {
	id: number; // file_id
	name: string; // file_name
	mime: string; // file_ext, file_mime_ext
	size: number; // file_size
	directory: {
		id: number; // directory_id
		name: string; // directory_name
		parent: number; // file_directory_parent_id
	};
	timestamp: string; // timestamp.date, timestamp.timezone_type, timestamp.timezone
	download_url: string; // file_download
}

interface Directory {
	id: number; // file_directory_id
	name: string; // file_directory_name
	parent_id: number; // file_directory_parent_id
	object: {
		id: number; // object_id
		inc: number; // object_inc_id
		type: number; // object_type_id
	};
	created: {
		timestamp: string; // object_created
		user: number; // user_id_created
	};
	modified: {
		timestamp: string; // object_modified
		user: number; // user_id_modified
	};
	status: {
		status: number; // object_status
		timestamp: string; // object_status_datetime
		user: number; // user_id_status
	};
	display: number; // object_display
	group_id: number; // =
	subfolder: number; // file_directory_subfolder
	children: Directory[]; // =
}
