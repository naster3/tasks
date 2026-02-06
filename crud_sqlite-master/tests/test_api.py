import pytest

from backend import create_app
from backend.extensions import db


@pytest.fixture()
def client(tmp_path):
    db_path = tmp_path / "test.db"
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
            "RATELIMIT_ENABLED": False,
            "API_KEY": "",
        }
    )
    with app.app_context():
        db.create_all()
    with app.test_client() as client:
        yield client


def create_task(client, title="Tarea", description="Detalle", status="en proceso"):
    response = client.post(
        "/api/tasks",
        json={"title": title, "description": description, "status": status},
    )
    assert response.status_code == 201
    return response.get_json()


def test_create_and_list_tasks(client):
    create_task(client, title="Primera", description="Uno", status="hecho")
    response = client.get("/api/tasks")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Primera"


def test_update_task(client):
    created = create_task(client, title="Actualizar", description="Desc")
    task_id = created["id"]
    response = client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Actualizado", "status": "hecho"},
    )
    assert response.status_code == 200
    updated = response.get_json()
    assert updated["title"] == "Actualizado"
    assert updated["status"] == "hecho"


def test_delete_task(client):
    created = create_task(client, title="Eliminar", description="Desc")
    task_id = created["id"]
    response = client.delete(f"/api/tasks/{task_id}")
    assert response.status_code == 204
    response = client.get("/api/tasks")
    data = response.get_json()
    assert data["total"] == 0


def test_validation(client):
    response = client.post(
        "/api/tasks",
        json={"title": "", "description": "Desc", "status": "hecho"},
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "title" in data.get("details", {})


def test_pagination(client):
    for index in range(30):
        create_task(client, title=f"Tarea {index}", description="Desc")
    response = client.get("/api/tasks?limit=10&page=2")
    assert response.status_code == 200
    data = response.get_json()
    assert data["page"] == 2
    assert data["limit"] == 10
    assert data["total"] == 30
    assert len(data["items"]) == 10


def test_status_filter(client):
    create_task(client, title="A", description="Desc", status="hecho")
    create_task(client, title="B", description="Desc", status="en proceso")
    response = client.get("/api/tasks?status=hecho")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] == 1
    assert all(item["status"] == "hecho" for item in data["items"])
