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

export default class Coach {
  private accessToken?: { expires: number; token: string };
  private coachToken?: { expires: number; token: string };
  private refreshToken?: { expires?: number; token: string };

  private userId: number = -1;
  private url: string = "";
  private domainId: number = -1;

  constructor(options: {
    token: { token: string; expires: string };
    refreshToken: string;
    url?: string;
    userId?: string;
    domainId?: number;
  }) {
    this.accessToken = {
      token: options.token.token,
      expires: new Date(options.token.expires).getTime(),
    };
    this.refreshToken = {
      token: options.refreshToken,
    };
  }

  private currentToken() {
    if (this.accessToken?.expires || 0 < Date.now()) {
      if (this.refreshToken?.token || "" == "")
        throw new Error("Refresh Token nicht verfügbar");
      this.getNewAccessToken();
    }
  }

  public async getNewAccessToken() {
    const data = {
      refresh_token: this.refreshToken?.token,
      grant_type: "refresh_token",
      client_id: "***REMOVED***",
      client_secret: "***REMOVED***",
    };

    const response = await fetch(
      "https://hochschule.provadis-coach.de/oauth/token",
      {
        method: "POST",
        headers: {
          "X-Requested-With": "de.provadis.provadiscampus",
        },
        body: JSON.stringify(data),
      }
    );
    if (response.status != 200)
      throw new Error(
        `Could not retrieve new Access Token. (Response ${response.status})`
      );
    const json = (await response.json()) as any;
    console.log(json);
    if (!json["success"])
      throw new Error(
        `Could not retrieve new Access Token. (Returned success=false)`
      );
    this.accessToken = {
      token: json["access_token"],
      expires: Date.now() + json["expires_in"],
    };
    this.refreshToken = {
      token: json["refresh_token"],
    };
  }

  private async getResource() {
    const result = await fetch(
      `https://hochschule.provadis-coach.de/oauth/resource?access_token=${this.accessToken?.token}`
    );
  }

  private getFiles(): File[] {
    // TODO
    return [];
  }

  private getDirectories(): Directory[] {
    // TODO
    return [];
  }

  public getFileStructure(): any {
    // TODO
    return [];
  }

  public static fromDatabase(): Coach {
    // TODO
    throw new Error();
  }

  public static fromQrCode(): Coach {
    // TODO
    throw new Error();
  }
}
