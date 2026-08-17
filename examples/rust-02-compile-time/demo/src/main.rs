use compile_time_macros::eval_integer;

fn main() {
    const ARITHMETIC: i64 = eval_integer!(add(2, multiply(3, 4)));

    println!("{ARITHMETIC}");
}
