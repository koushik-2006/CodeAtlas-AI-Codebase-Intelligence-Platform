import uuid
from sqlalchemy import String, TypeDecorator, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB
import json


class GUID(TypeDecorator):
    """Platform-independent GUID type. Uses PostgreSQL's UUID type, otherwise uses String(36)."""
    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            try:
                parsed_val = uuid.UUID(str(value))
            except (ValueError, AttributeError):
                parsed_val = uuid.uuid5(uuid.NAMESPACE_DNS, str(value))
        else:
            parsed_val = value

        if dialect.name == "postgresql":
            return parsed_val
        return str(parsed_val)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return str(value)


class JSONType(TypeDecorator):
    """Platform-independent JSON/JSONB type."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_JSONB())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        return json.loads(value)
