use compile_time_macros::{partial_integer, residual_integer};

fn main() {
    let x = 7;

    let from_source = partial_integer! {
        known compiled = fib(20);
        residual x + compiled;
    };

    let from_residual = residual_integer!({
        let compiled = 6765i64;
        x + compiled
    });

    println!("{from_source}");
    println!("{from_residual}");
}
