import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base_class import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()

    # Create a new session for each test
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=connection
    )
    session = TestingSessionLocal()

    yield session

    # Close and rollback the session after the test
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Create a test client for the FastAPI app"""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Reset the dependency override after the test
    app.dependency_overrides = {}
