use compile_time_macros::{eval_and_compare, eval_integer};

fn matches(x: i64) -> bool {
    eval_and_compare!(add(2, multiply(3, 4)) == x)
}

fn main() {
    println!("{}", matches(14));
    println!("{}", matches(15));
}
