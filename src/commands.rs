//! UI/backend entry points. Keep protocol dispatch thin; put business logic in
//! separate modules as the plugin grows.

use serde_json::{Value, json};
use wonderland_plugin_sdk::{HostClient, PluginError};

use crate::{PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION};

pub fn dispatch(
    _host: HostClient,
    method: String,
    params: Value,
    _request_id: Option<String>,
) -> Result<Value, PluginError> {
    if method == "__cancel" {
        return Ok(Value::Null);
    }

    dispatch_method(&method, params)
}

fn dispatch_method(method: &str, params: Value) -> Result<Value, PluginError> {
    match method {
        "get_info" if params.as_object().is_some_and(|object| object.is_empty()) => Ok(json!({
            "id": PLUGIN_ID,
            "name": PLUGIN_NAME,
            "version": PLUGIN_VERSION,
        })),
        "get_info" => Err(PluginError::new(
            "INVALID_INPUT",
            "get_info expects an empty object",
        )),
        _ => Err(PluginError::new(
            "METHOD_NOT_FOUND",
            "method is not supported",
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::dispatch_method;
    use crate::{PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION};
    use serde_json::{Value, json};

    #[test]
    fn get_info_returns_the_plugin_identity() {
        let info = dispatch_method("get_info", json!({})).expect("get_info should succeed");
        assert_eq!(
            info,
            json!({
                "id": PLUGIN_ID,
                "name": PLUGIN_NAME,
                "version": PLUGIN_VERSION,
            })
        );
    }

    #[test]
    fn get_info_rejects_unexpected_parameters() {
        let error = dispatch_method("get_info", json!({"unexpected": true}))
            .expect_err("unexpected parameters should fail");
        assert_eq!(error.code, "INVALID_INPUT");
    }

    #[test]
    fn unknown_methods_are_reported() {
        let error =
            dispatch_method("missing", Value::Null).expect_err("unknown methods should fail");
        assert_eq!(error.code, "METHOD_NOT_FOUND");
    }
}
