use compile_time_macros::eval_integer;

fn main() {
    const FIB_40: i64 = eval_integer!(fib(40));
    println!("{FIB_40}");
}
