import {Database, Statement} from 'sqlite3';
import {readFile} from 'fs/promises';

const db = new Database('./data/data.sqlite', err => {
	if (err) {
		return console.error(err.message);
	}
	console.log('Connected to Database');
	createTables();
});

function createTables() {
	const CREATE_FOLDER_TABLE = `
    CREATE TABLE IF NOT EXISTS folder (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        parent INTEGER,
        FOREIGN KEY(parent) REFERENCES folder(id)
    )
    `;

	const CREATE_FILE_TABLE = `
    CREATE TABLE IF NOT EXISTS file (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        mime TEXT,
        timestamp INTEGER NOT NULL,
        size INTEGER,
        download_url TEXT NOT NULL,
        folder INTEGER,
        FOREIGN KEY(folder) REFERENCES folder(id)
    )
    `;
	db.serialize(() => {
		// Create Tables
		db.run(CREATE_FOLDER_TABLE, err => {
			if (err) console.error(err.message);
			console.log('Created folder Table');
		});
		db.run(CREATE_FILE_TABLE, err => {
			if (err) console.error(err.message);
			console.log('Created file Table');
		});
	});
}

function insertDirectories(root: any, stmt: Statement) {
	const id = parseInt(root['file_directory_id']);
	const name = root['file_directory_name'];
	const timestamp = new Date(root['object_modified']).getTime();
	const parentId = parseInt(root['file_directory_parent_id']);
	stmt.bind(id, name, timestamp || 0, parentId == 0 ? null : parentId);
	stmt.run(err => {
		if (err) return console.error(err.message);
		console.log(`+ "#${id} - ${name}"`);
	});
	root['children'].forEach((child: any) => {
		insertDirectories(child, stmt);
	});
}

function insertFiles(files: any[], stmt: Statement) {
	files.forEach(file => {
		stmt.bind(
			parseInt(file['file_id']),
			file['file_name'],
			file['file_mime_ext'],
			new Date(file['timestamp']['date']).getTime() || 0,
			parseInt(file['file_size']),
			file['file_download'],
			parseInt(file['directory_id'])
		);
		stmt.run(err => {
			if (err) return console.error(err.message);
			console.log(`+ "#${file['file_id']} - ${file['file_name']}"`);
		});
	});
}

readFile('./data/mock.json').then(value => {
	const json = JSON.parse(value.toString());
	insertDirectories(json['directories']['data'], db.prepare('INSERT INTO folder VALUES (?, ?, ?, ?)'));
	insertFiles(json['files']['data'], db.prepare('INSERT INTO file VALUES (?, ?, ?, ?, ?, ?, ?)'));
});
