use compile_time_macros::{partial_integer, residual_integer};

fn main() {
    let x = 7;

    let from_source = partial_integer! {
        known compiled = add(2, multiply(3, 4));
        residual x + compiled;
    };

    let from_residual = residual_integer!({
        let compiled = 14i64;
        x + compiled
    });

    println!("{from_source}");
    println!("{from_residual}");
}
