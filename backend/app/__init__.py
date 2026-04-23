from flask import Flask
from flask_cors import CORS
from .extensions import db
from .scheduler import init_scheduler
from .firebase import init_firebase


def create_app(test_config: dict = None):
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    if test_config:
        app.config.update(test_config)

    CORS(app)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    init_firebase()

    # Skip scheduler in testing mode to avoid background threads during tests
    if not app.config.get("TESTING"):
        init_scheduler(app)

    from .routes import status, vehicles, stations, accessibility, favorites
    app.register_blueprint(status.bp)
    app.register_blueprint(vehicles.bp)
    app.register_blueprint(stations.bp)
    app.register_blueprint(accessibility.bp)
    app.register_blueprint(favorites.bp)

    return app
