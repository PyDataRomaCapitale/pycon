from datetime import datetime, timedelta, timezone

import jwt
from pythonit_toolkit.pastaporto.tokens import decode_service_to_service_token
from ward import raises, test


@test("decode service to service")
async def _():
    test_token = jwt.encode(
        {
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(seconds=10),
            "iss": "test",
            "aud": "users-service",
        },
        "secret",
        algorithm="HS256",
    )

    decode_service_to_service_token(
        test_token, "secret", issuer="test", audience="users-service"
    )


@test("reject tokens without expiration")
async def _():
    test_token = jwt.encode(
        {"iat": datetime.now(timezone.utc), "iss": "test", "aud": "users-service"},
        "secret",
        algorithm="HS256",
    )

    with raises(jwt.MissingRequiredClaimError):
        decode_service_to_service_token(
            test_token, "secret", issuer="test", audience="users-service"
        )


@test("reject tokens without audience")
async def _():
    test_token = jwt.encode(
        {
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(seconds=10),
            "iss": "test",
        },
        "secret",
        algorithm="HS256",
    )

    with raises(jwt.MissingRequiredClaimError):
        decode_service_to_service_token(
            test_token, "secret", issuer="test", audience="users-service"
        )


@test("reject tokens with different audience")
async def _():
    test_token = jwt.encode(
        {
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(seconds=10),
            "iss": "test",
            "aud": "users-service",
        },
        "secret",
        algorithm="HS256",
    )

    with raises(jwt.InvalidAudienceError):
        decode_service_to_service_token(
            test_token, "secret", issuer="test", audience="association-backend"
        )
