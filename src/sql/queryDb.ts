import { Database } from "sqlite3";

const db = new Database("./data/data.sqlite", (err) => {
    if(err) {
        return console.error(err.message)
    }
    console.log("Connected to Database")
})

const RECURSIVE_SQL = `
WITH RECURSIVE folder_structure AS (
    SELECT  id,
            name,
            timestamp,
            parent,
            name AS textPath,
            id AS idPath,
            0 AS level
    FROM folder 
    WHERE parent IS NULL 
    UNION ALL
    SELECT  f.id,
            f.name,
            f.timestamp,
            f.parent,
            folder_structure.textPath || '/' || f.name,
            folder_structure.idPath || '/' || f.id,
            folder_structure.level + 1 as level
    FROM folder f, folder_structure
    WHERE f.parent = folder_structure.id
)
`
db.serialize(() => {
    // db.each(RECURSIVE_SQL+"SELECT * FROM folder_structure ORDER BY level DESC LIMIT 3", (err, row) => {
    //     if(err) return console.error(err.message)
    //     console.log(row)
    // })
    
    
    db.all(RECURSIVE_SQL+`
    SELECT  f.*,
            fs.textPath || '/' || f.name || '.' || f.mime AS path,
            fs.level AS level
    FROM file f, folder_structure fs
    INNER JOIN folder_structure ON f.folder = fs.id
    `, (err, rows) => {
        
    })     
})