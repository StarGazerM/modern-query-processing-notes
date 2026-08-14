// ANCHOR: data_shapes
struct Folder {
    id: u64,
    entries: Vec<Entry>,
}

enum Entry {
    File(u64),
    Subfolder(Folder),
    Unreadable,
}

#[derive(Debug)]
enum ReadError {
    Unreadable,
}
// ANCHOR_END: data_shapes

// ANCHOR: traversal
fn total_bytes(folder: &Folder) -> Result<u64, ReadError> {
    let mut total = 0;

    for entry in &folder.entries {
        total += match entry {
            Entry::File(bytes) => *bytes,
            Entry::Subfolder(child) => total_bytes(child)?,
            Entry::Unreadable => return Err(ReadError::Unreadable),
        };
    }

    Ok(total)
}
// ANCHOR_END: traversal

// ANCHOR: program
fn main() {
    let folder = Folder {
        id: 0,
        entries: vec![
            Entry::File(40),
            Entry::Subfolder(Folder {
                id: 1,
                entries: vec![Entry::File(2)],
            }),
        ],
    };

    let first_read = total_bytes(&folder);
    let second_read = total_bytes(&folder);
    println!("folder {}, first read: {first_read:?}", folder.id);
    println!("folder {}, second read: {second_read:?}", folder.id);

    let blocked = Folder {
        id: 2,
        entries: vec![Entry::Unreadable],
    };
    println!("blocked: {:?}", total_bytes(&blocked));
}
// ANCHOR_END: program
