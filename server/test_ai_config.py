from app.ai import rag_pipeline


def test_runtime_config_validation():
    missing = rag_pipeline.validate_runtime_config()
    assert isinstance(missing, list)


if __name__ == "__main__":
    test_runtime_config_validation()
    print("AI_CONFIG_OK")
