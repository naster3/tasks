"""Constructores deterministas para productos, stock y movimientos de prueba."""

from collections.abc import Iterator

from ..db.models import now_utc

TEST_USER_PREFIX = "test_"
TEST_PRODUCT_PREFIX = "TEST-PRD-"
TEST_ITEM_NOTE_PREFIX = "[seed:test-data]"
TEST_MOVEMENT_NOTE_PREFIX = "[seed:test-movements]"

PRODUCT_CATEGORIES = [
    ("Camisas", "Camisa Oxford"),
    ("Pantalones", "Pantalon Chino"),
    ("Chaquetas", "Chaqueta Bomber"),
    ("Vestidos", "Vestido Casual"),
    ("Calzado", "Zapato Urbano"),
    ("Accesorios", "Bolso Mini"),
    ("Sudaderas", "Sudadera Sport"),
    ("Blazers", "Blazer Ejecutivo"),
    ("Faldas", "Falda Midi"),
    ("Accesorios", "Cinturon Clasico"),
]

SIZES = ["S", "M", "L", "XL", "32", "34", "36", "38", "40", "42"]
COLOR_GROUPS = [
    ("Azul", "Azul Marino", "Celeste"),
    ("Negro", "Gris", "Carbon"),
    ("Verde", "Oliva", "Musgo"),
    ("Rojo", "Vino", "Borgona"),
    ("Blanco", "Crema", "Marfil"),
    ("Beige", "Camel", "Arena"),
    ("Gris", "Antracita", "Humo"),
    ("Azul Oscuro", "Azul Petroleo", "Marino"),
    ("Lila", "Lavanda", "Malva"),
    ("Marron", "Tabaco", "Cafe"),
]
LOCATIONS = ["Almacen A", "Almacen B", "Tienda Centro", "Tienda Norte", "Outlet", "Showroom"]
BASE_PRICES = [24.99, 29.99, 44.99, 39.99, 54.99, 19.99, 34.99, 64.99, 27.99, 14.99]


def build_test_product(index: int) -> dict:
    # Los atributos ciclan por indice para que el fixture varie sin perder reproducibilidad.
    category_index = (index - 1) // 20
    category, base_name = PRODUCT_CATEGORIES[category_index]
    colors = COLOR_GROUPS[category_index]
    color = colors[(index - 1) % len(colors)]
    size = SIZES[(index - 1) % len(SIZES)]
    location = LOCATIONS[(index - 1) % len(LOCATIONS)]
    price = round(BASE_PRICES[category_index] + ((index - 1) % 6) * 0.5, 2)
    initial_stock = 8 + ((index * 3) % 25)

    return {
        "sku": f"{TEST_PRODUCT_PREFIX}{index:04d}",
        "name": f"{base_name} {color} {index:03d}",
        "category": category,
        "size": size,
        "color": color,
        "price": price,
        "location": location,
        "initial_stock": initial_stock,
    }


def iter_test_products(total: int = 200) -> Iterator[dict]:
    # El generador mantiene el uso de memoria estable incluso si crecen los fixtures.
    for index in range(1, total + 1):
        yield build_test_product(index)


def build_initial_item_audit_note() -> str:
    return f"{TEST_ITEM_NOTE_PREFIX} Registro inicial"


def build_initial_stock_note() -> str:
    return f"{TEST_ITEM_NOTE_PREFIX} Stock inicial"


def build_seed_movement_note(label: str) -> str:
    return f"{TEST_MOVEMENT_NOTE_PREFIX} {label}"


def timestamp_now():
    # Reutiliza la hora compartida para que los fixtures sigan la misma semantica temporal.
    return now_utc()
