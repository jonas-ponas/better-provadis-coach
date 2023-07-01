/**
 * This file was @generated using pocketbase-typegen
 */

export enum Collections {
	Acl = 'acl',
	Changelog = 'changelog',
	Directory = 'directory',
	File = 'file',
	LatestSystemMessage = 'latestSystemMessage',
	News = 'news',
	State = 'state',
	SystemMessage = 'systemMessage',
	UserFiles = 'userFiles',
	Users = 'users',
	VisibleFileCount = 'visibleFileCount'
}

// Alias types for improved usability
export type IsoDateString = string;
export type RecordIdString = string;
export type HTMLString = string;

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString;
	created: IsoDateString;
	updated: IsoDateString;
	collectionId: string;
	collectionName: Collections;
	expand?: T;
};

export type AuthSystemFields<T = never> = {
	email: string;
	emailVisibility: boolean;
	username: string;
	verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export type AclRecord = {
	user: RecordIdString;
	file?: RecordIdString;
};

export type ChangelogRecord<Tdiff = unknown> = {
	time?: IsoDateString;
	triggered_by?: RecordIdString;
	diff?: null | Tdiff;
	success?: boolean;
	reason?: string;
};

export type DirectoryRecord = {
	name: string;
	timestamp: IsoDateString;
	parent?: RecordIdString;
	coachId: number;
	fullpath: string;
};

export type FileRecord = {
	equals?: RecordIdString;
	hash: string;
	size: number;
	timestamp: IsoDateString;
	coachId: number;
	directory: RecordIdString;
	name: string;
	fullpath: string;
	previous?: RecordIdString;
	content?: string;
};

export type LatestSystemMessageRecord = {
	title?: string;
	text?: HTMLString;
};

export type NewsRecord = {
	coachId?: number;
	title?: string;
	text?: HTMLString;
	author?: string;
	dateCreated?: IsoDateString;
	allowedUsers?: RecordIdString[];
};

export type StateRecord = {
	user: RecordIdString;
	refreshToken?: string;
	token: string;
	expires: IsoDateString;
	url: string;
	domainId?: number;
	coachUserId?: number;
	lastSync?: IsoDateString;
	coachUsername?: string;
	lastSyncSuccessful?: boolean;
	lastFilesHash?: string;
	lastNewsHash?: string;
	lastDirHash?: string;
};

export type SystemMessageRecord = {
	title?: string;
	text?: HTMLString;
};

export type UserFilesRecord = {
	user: RecordIdString;
	fullpath: string;
	coachId: number;
	timestamp: IsoDateString;
	name: string;
	hash: string;
	size: number;
	equals?: RecordIdString;
	directory: RecordIdString;
	previous?: RecordIdString;
	content?: string;
};

export type UsersRecord = {
	name?: string;
	avatar?: string;
	favorites?: RecordIdString[];
	rootDirectory?: RecordIdString;
	avatarUrl?: string;
	autoSync?: boolean;
	scheduleDirectory?: RecordIdString;
	completedOnboarding?: boolean;
};

export type VisibleFileCountRecord = {
	fileCount?: number;
};

// Response types include system fields and match responses from the PocketBase API
export type AclResponse<Texpand = unknown> = Required<AclRecord> & BaseSystemFields<Texpand>;
export type ChangelogResponse<Tdiff = unknown, Texpand = unknown> = Required<ChangelogRecord<Tdiff>> &
	BaseSystemFields<Texpand>;
export type DirectoryResponse<Texpand = unknown> = Required<DirectoryRecord> & BaseSystemFields<Texpand>;
export type FileResponse<Texpand = unknown> = Required<FileRecord> & BaseSystemFields<Texpand>;
export type LatestSystemMessageResponse<Texpand = unknown> = Required<LatestSystemMessageRecord> &
	BaseSystemFields<Texpand>;
export type NewsResponse<Texpand = unknown> = Required<NewsRecord> & BaseSystemFields<Texpand>;
export type StateResponse<Texpand = unknown> = Required<StateRecord> & BaseSystemFields<Texpand>;
export type SystemMessageResponse<Texpand = unknown> = Required<SystemMessageRecord> & BaseSystemFields<Texpand>;
export type UserFilesResponse<Texpand = unknown> = Required<UserFilesRecord> & BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>;
export type VisibleFileCountResponse<Texpand = unknown> = Required<VisibleFileCountRecord> & BaseSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	acl: AclRecord;
	changelog: ChangelogRecord;
	directory: DirectoryRecord;
	file: FileRecord;
	latestSystemMessage: LatestSystemMessageRecord;
	news: NewsRecord;
	state: StateRecord;
	systemMessage: SystemMessageRecord;
	userFiles: UserFilesRecord;
	users: UsersRecord;
	visibleFileCount: VisibleFileCountRecord;
};

export type CollectionResponses = {
	acl: AclResponse;
	changelog: ChangelogResponse;
	directory: DirectoryResponse;
	file: FileResponse;
	latestSystemMessage: LatestSystemMessageResponse;
	news: NewsResponse;
	state: StateResponse;
	systemMessage: SystemMessageResponse;
	userFiles: UserFilesResponse;
	users: UsersResponse;
	visibleFileCount: VisibleFileCountResponse;
};
