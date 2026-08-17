// ANCHOR: block_value
fn add_delay(scheduled: u32, delay: u32) -> u32 {
    scheduled + delay
}
// ANCHOR_END: block_value

// ANCHOR: data_shapes
enum Status {
    OnTime,
    Late(u32),
    Cancelled,
}

struct Train {
    scheduled: u32,
    status: Status,
}
// ANCHOR_END: data_shapes

// ANCHOR: fallible_read
enum DepartureError {
    Cancelled,
}

fn delay(status: &Status) -> Result<u32, DepartureError> {
    match status {
        Status::OnTime => Ok(0),
        Status::Late(minutes) => Ok(*minutes),
        Status::Cancelled => Err(DepartureError::Cancelled),
    }
}

fn departure(train: &Train) -> Result<u32, DepartureError> {
    let minutes_late = delay(&train.status)?;
    Ok(add_delay(train.scheduled, minutes_late))
}
// ANCHOR_END: fallible_read

// ANCHOR: program
fn show(result: Result<u32, DepartureError>) {
    match result {
        Ok(minutes) => println!("leaves at minute {minutes}"),
        Err(DepartureError::Cancelled) => println!("cancelled"),
    }
}

fn main() {
    let late = Train {
        scheduled: 60,
        status: Status::Late(5),
    };

    show(departure(&late));
    show(departure(&late));

    let on_time = Train {
        scheduled: 90,
        status: Status::OnTime,
    };
    show(departure(&on_time));

    let cancelled = Train {
        scheduled: 120,
        status: Status::Cancelled,
    };
    show(departure(&cancelled));
}
// ANCHOR_END: program
