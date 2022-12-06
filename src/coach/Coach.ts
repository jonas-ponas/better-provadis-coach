import {HmacSHA256} from 'crypto-js';
import {stringify} from 'crypto-js/enc-hex';

const ZEROTIME = new Date(0).toISOString();

export class Coach {
	private accessToken?: {expires: number; token: string};
	private coachToken?: {expires: number; token: string};
	private refreshToken?: {expires?: number; token: string};

	private userId: number = -1;
	private url: string = '';
	private domainId: number = -1;

	private coachMeta?: {name: string; version: string; id: string};

	private clientId?: string;
	private clientSecret?: string;

	constructor(options: {
		token: string;
		expires: string | number;
		refreshToken: string;
		clientSecret: string;
		clientId: string;
		url?: string;
		userId?: string;
		domainId?: number;
	}) {
		this.accessToken = {
			token: options.token,
			expires: typeof options.expires != 'number' ? new Date(options.expires).getTime() : options.expires
		};
		this.refreshToken = {
			token: options.refreshToken
		};
		this.domainId = options.domainId || -1;
		this.url = options.url || 'hochschule.provadis-coach.de';

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

	private async getNewAccessToken() {
		console.debug('Refreshing Token...');
		const response = await fetch(`https://${this.url}/oauth/token`, {
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
		if (!json['success']) throw new Error(`Could not retrieve new Access Token. (Returned success=false)`);
		this.accessToken = {
			token: json['access_token'],
			expires: new Date().getTime() + parseInt(json['expires_in']) * 1000
		};
		this.refreshToken = {
			token: json['refresh_token']
		};
		console.debug(
			'Refreshed Access- and Refresh-Token. Expires',
			new Date(this.accessToken.expires).toISOString(), this.accessToken.token, this.refreshToken.token
		);
	}

	public async getUserInfo(): Promise<{
		coach: {name: string, version: string, id: string},
		domain: {id: number, name: string},
		user: {id: number, firstname: string, familyname: string},
		token: {access_token: string, client_id: string, expires: number, refresh_token: string, scope: string, token_type: string}
	}> {
		console.debug('Getting Oauth User-Info...');
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
				client_verifier: HmacSHA256(this.clientSecret || '', this.accessToken?.token || '').toString(),
				client_id: this.clientId || ''
			})
		};
		const response = await fetch(`https://${this.url}/oauth/userinfo`, options);

		if (response.status != 200) {
			try {
				const json = await response.json();
				throw new Error(`Request failed (${json['error']}: ${json['error_description']})`);
			} catch (e) {
				throw new Error('Request failed (' + response.statusText + ')');
			}
		}
		const json = await response.json();
		if (json.error) {
			throw new Error(`Request failed (${json['error']}: ${json['error_description']})`);
		}
		if (json.token?.access_token) {
			this.accessToken = {
				token: json.token?.access_token,
				expires: json.token?.expires
			};
			console.debug('Updated Access-Token via User-Info', this.accessToken.token);
		}
		if (json?.token?.refresh_token) {
			this.refreshToken = {
				token: json.token?.refresh_token
			};
			console.debug('Updated Refresh-Token via User-Info', this.refreshToken.token);
		}
		if (json?.user?.id) {
			this.userId = json.user.id;
		}
		if (json?.coach) {
			this.coachMeta = {
				name: json.coach.name,
				version: json.coach.version,
				id: json.coach.version
			};
		}
		return json;
	}

	private async getResource() {
		await this.checkAccessToken();
		const response = await fetch(`https://${this.url}/oauth/resource?access_token=${this.accessToken?.token}`);
		if (response.status != 200) throw new Error(`Request was not successful (Response ${response.status})`);
		const json = (await response.json()) as any;
		if (!json['success']) throw new Error(`Request was not successful (success=false)`);
		this.coachToken = {
			token: json['coach']['login_token'] || '',
			expires: (json['coach']['expires'] || 0) * 1000
		};
		console.debug('Updated Coach-Login-Token' /* this.coachToken*/);
	}

	public async getFiles(): Promise<File[]> {
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
		const response = await fetch(`https://${this.url}/api/files/${urlParams}`, {
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
		let files: File[] = json['data'].map((v: any, i: number, a: any[]): File => {
			return {
				id: parseInt(v?.file_id) || -1,
				name: v?.file_name || '',
				mime: v?.file_ext || '',
				size: parseInt(v?.file_size) || -1,
				directory: {
					id: parseInt(v?.directory_id) || -1,
					name: v?.directory_name || '',
					parent: parseInt(v?.file_directory_parent_id) || -1
				},
				timestamp: v?.timestamp?.date || new Date(0).toISOString(),
				download_url: v?.file_download || ''
			};
		});
		console.debug('Received Files', files.length);
		return files;
	}

	public async getDirectories(): Promise<Directory[]> {
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
		const response = await fetch(`https://${this.url}/api/FilesDirTree/${urlParams}`, {
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
		let directories = this.parseDirectory(json['data']);
		console.debug('Received Directories', directories.length);
		return directories;
	}

	public async getNews(): Promise<NewsItem[]> {
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
		const response = await fetch(`https://${this.url}/api/news/${urlParams}`, {
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
		let newsItems: NewsItem[] = json['data'].map((v: any, i: number, a: any[]): NewsItem => {
			return {
				id: parseInt(v?.id) || -1,
				title: v?.title || '',
				text: v?.text || '',
				author: v?.author || '',
				modified: v?.modified_date || ZEROTIME,
				created: v?.created?.date || ZEROTIME,
				mapped: parseInt(v?.mapped) || -1,
				source: parseInt(v?.source_id) || -1
			};
		});
		console.debug('Received News-Items', newsItems.length);
		return newsItems;
	}

	public async getFileContents(fileId: number): Promise<Blob> {
		this.checkCoachToken()
		const response = await fetch(`https://${this.url}/shared/filemanager/${fileId}?login_token=${this.coachToken?.token}`)
		// if(!response?.body) throw new Error("Response body empty");
		return response.blob()
	}

	public getFileStructure(): any {
		// TODO: Take getFiles and getDirectories and turn it in one big structure
		return [];
	}

	public static async createFromQrCode(
		qrcode: {
			token: string;
			expires: string;
			refreshToken: string;
			url?: string;
			userId?: string;
			domainId?: number;
		},
		clientSecret: string,
		clientId: string
	): Promise<Coach> {
		let coach = new Coach({
			...qrcode,
			clientSecret,
			clientId
		});
		try {
			const data = await coach.getUserInfo();
			console.debug('Got User-Info: ', data.user.firstname + ' ' + data.user.familyname, data.user.id);
			return coach;
		} catch (e) {
			throw e;
		}
	}

	public static async createFromState(state: {
		token: string;
		expires: number;
		refreshToken: string;
		url?: string;
		userId?: string;
		domainId?: number;
		clientSecret: string;
		clientId: string;
	}) {
		let coach = new Coach(state);
		try {
			if(state.refreshToken == "") {
				await coach.getUserInfo()
			} else {
				await coach.checkAccessToken()
			}
			return coach;
		} catch (e) {
			throw e;
		}
	}

	public exportFromState() {
		return {
			refreshToken: this.refreshToken?.token,
			token: this.accessToken?.token,
			expires: this.accessToken?.expires,
			url: this.url,
			userId: this.userId,
			domainId: this.domainId
		};
	}

	/* ----------------------------
      Below are Helper functions
     ----------------------------  */
	private async checkAccessToken() {
		console.debug('Check Access Token...');
		if ((this.accessToken?.expires || 0) < new Date().getTime()) {
			console.debug('Access-Token expired. Getting new Access-Token');
			if ((this.refreshToken?.token || '') == '') {
				throw new Error('Refresh-Token nicht verfügbar');
			}
			await this.getNewAccessToken();
		}
		return true;
	}

	private async checkCoachToken() {
		console.debug('Check Coach-Login Token...');
		if ((this.coachToken?.expires || 0) < new Date().getTime()) {
			console.debug('Coach-Login-Token expired. Getting new Coach-Login-Token...');
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
		const signature = stringify(HmacSHA256(signatureString, this.accessToken!!.token));
		return (
			generateParams(obj, '/', '/') + 'signature/' + encodeURI(Buffer.from(signature, 'utf-8').toString('base64'))
		);
	}

	private parseDirectory(root: any): Directory[] {
		let directories: Directory[] = [];
		directories.push({
			id: parseInt(root.file_directory_id) || -1,
			name: root.file_directory_name || '',
			parent_id: parseInt(root.file_directory_parent_id) || -1,
			object: {
				id: parseInt(root?.object_id) || -1,
				inc: parseInt(root?.object_inc_id) || -1,
				type: parseInt(root?.object_type_id) || -1
			},
			created: {
				timestamp: root?.object_created || ZEROTIME,
				user: parseInt(root?.user_id_created) || -1
			},
			modified: {
				timestamp: root?.object_modified || ZEROTIME,
				user: parseInt(root?.user_id_modified) || -1
			},
			status: {
				status: root?.object_status,
				timestamp: root?.object_status_datetime || ZEROTIME,
				user: parseInt(root?.user_id_status) || -1
			},
			display: parseInt(root?.object_display) || -1,
			group_id: parseInt(root?.group_id) || -1,
			subfolder: parseInt(root?.file_directory_subfolder) || -1
		});
		root?.children.forEach((child: any) => {
			directories.push(...this.parseDirectory(child));
		});
		return directories;
	}
}

export interface File {
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

export interface Directory {
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
	// children: Directory[]; // =
}

export interface NewsItem {
	id: number; // =
	title: string; // =
	text: string; // =
	author: string; // =
	modified: string; // modified_date
	created: string; // created.date
	mapped: number; // =
	source: number; // source_id
}
