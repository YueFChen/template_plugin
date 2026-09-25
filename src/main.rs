use std::io::{self, BufRead, Write};

use serde_json::{Value, json};
use sha2::{Digest, Sha256};

const PLUGIN_ID: &str = "template_plugin";
const PLUGIN_NAME: &str = "Wonderland Plugin Template";
const PLUGIN_VERSION: &str = "0.1.0";

fn main() {
    let contract = match std::fs::read("contract.json") {
        Ok(bytes) => bytes,
        Err(error) => {
            eprintln!("cannot read contract.json: {error}");
            std::process::exit(2);
        }
    };
    let contract_sha256 = format!("{:x}", Sha256::digest(contract));
    let stdin = io::stdin();
    let mut stdout = io::BufWriter::new(io::stdout().lock());

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(line) => line,
            Err(error) => {
                eprintln!("cannot read protocol input: {error}");
                break;
            }
        };
        let message: Value = match serde_json::from_str(&line) {
            Ok(message) => message,
            Err(error) => {
                eprintln!("invalid protocol JSON: {error}");
                break;
            }
        };

        match message.get("type").and_then(Value::as_str) {
            Some("hello") if message.get("role").and_then(Value::as_str) == Some("host") => {
                if message.get("pluginId").and_then(Value::as_str) != Some(PLUGIN_ID) {
                    eprintln!("host requested the wrong plugin ID");
                    std::process::exit(3);
                }
                let hello = json!({
                    "protocol": "wonderland-plugin",
                    "version": "1.0.0",
                    "type": "hello",
                    "role": "plugin",
                    "pluginId": PLUGIN_ID,
                    "pluginVersion": PLUGIN_VERSION,
                    "contractSha256": contract_sha256,
                });
                if write_frame(&mut stdout, &hello).is_err() {
                    break;
                }
            }
            Some("request") => {
                let id = message.get("id").and_then(Value::as_str).unwrap_or("");
                let method = message.get("method").and_then(Value::as_str).unwrap_or("");
                let params = message.get("params").cloned().unwrap_or(Value::Null);
                let result = match method {
                    "get_info" if params.as_object().is_some_and(|object| object.is_empty()) => {
                        json!({
                            "id": PLUGIN_ID,
                            "name": PLUGIN_NAME,
                            "version": PLUGIN_VERSION,
                        })
                    }
                    "get_info" => {
                        let response = error(id, "INVALID_INPUT", "get_info expects an empty object");
                        if write_frame(&mut stdout, &response).is_err() {
                            break;
                        }
                        continue;
                    }
                    _ => {
                        let response = error(id, "METHOD_NOT_FOUND", "method is not supported");
                        if write_frame(&mut stdout, &response).is_err() {
                            break;
                        }
                        continue;
                    }
                };
                let response = json!({
                    "protocol": "wonderland-plugin",
                    "version": "1.0.0",
                    "type": "result",
                    "id": id,
                    "result": result,
                });
                if write_frame(&mut stdout, &response).is_err() {
                    break;
                }
            }
            Some("cancel") => {
                let id = message.get("id").and_then(Value::as_str).unwrap_or("");
                let response = error(id, "CANCELLED", "request cancelled");
                if write_frame(&mut stdout, &response).is_err() {
                    break;
                }
            }
            _ => {
                eprintln!("unexpected protocol message");
                break;
            }
        }
    }
}

fn error(id: &str, code: &str, message: &str) -> Value {
    json!({
        "protocol": "wonderland-plugin",
        "version": "1.0.0",
        "type": "error",
        "id": id,
        "error": { "code": code, "message": message, "details": null },
    })
}

fn write_frame(stdout: &mut impl Write, frame: &Value) -> io::Result<()> {
    serde_json::to_writer(&mut *stdout, frame)?;
    stdout.write_all(b"\n")?;
    stdout.flush()
}
