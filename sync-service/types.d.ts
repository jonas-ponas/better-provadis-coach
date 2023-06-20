export interface FileRecord extends Record {
	name: string;
	size: number;
	timestamp: string;
	coachId: number;
	parent: string;
	cachedFile?: string;
	allowedUser: string[];
}
