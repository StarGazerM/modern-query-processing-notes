use stringify_macro::code_string;

fn main() {
    let x = 1 + 1;

    println!("{}", code_string!(1 + 1));
    println!("{}", code_string!(x));
    println!("{}", code_string!(relation road(City, City);));
    println!("{x}");
}
