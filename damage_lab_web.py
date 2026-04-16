from __future__ import annotations

from dataclasses import dataclass
import os
import socket
import threading
import webbrowser

from flask import Flask, abort, jsonify, render_template, request, send_file, send_from_directory

from damage_lab_core import PROJECT_ROOT, RULES_DIR, get_ui_config, parse_analysis_input, result_to_payload, run_analysis

WEB_ROOT = PROJECT_ROOT / 'web'
TEMPLATES_DIR = WEB_ROOT / 'templates'
STATIC_DIR = WEB_ROOT / 'static'
PAGES_DPS_LAB_DIR = PROJECT_ROOT / 'pages' / 'ARTINX-Calculate-Lab'
ASSETS_DIR = PROJECT_ROOT / 'assets'

FOLDER_MAP = {
    'buff': RULES_DIR / '增益',
    'rules': RULES_DIR,
}


@dataclass(frozen=True)
class WebMode:
    public_web: bool
    show_rule_images: bool
    allow_folder_actions: bool


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def _resolve_web_mode(public_web: bool | None = None) -> WebMode:
    resolved_public = _env_flag('DAMAGE_LAB_PUBLIC', False) if public_web is None else bool(public_web)
    show_rule_images = not resolved_public and not _env_flag('DAMAGE_LAB_HIDE_RULE_IMAGES', False)
    allow_folder_actions = not resolved_public and hasattr(os, 'startfile')
    return WebMode(
        public_web=resolved_public,
        show_rule_images=show_rule_images,
        allow_folder_actions=allow_folder_actions,
    )


def create_app(public_web: bool | None = None) -> Flask:
    web_mode = _resolve_web_mode(public_web)
    app = Flask(__name__, template_folder=str(TEMPLATES_DIR), static_folder=str(STATIC_DIR), static_url_path='/static')
    app.config['DAMAGE_LAB_WEB_MODE'] = web_mode

    @app.route('/')
    def index():
        return render_template(
            'damage_lab.html',
            public_web=web_mode.public_web,
            show_rule_images=web_mode.show_rule_images,
            allow_folder_actions=web_mode.allow_folder_actions,
        )

    @app.get('/ARTINX-Calculate-Lab/')
    def dps_lab_page():
        return send_from_directory(PAGES_DPS_LAB_DIR, 'ARTINX-Calculate-Lab.html')

    @app.get('/ARTINX-Calculate-Lab/<path:filename>')
    def dps_lab_asset(filename: str):
        return send_from_directory(PAGES_DPS_LAB_DIR, filename)

    @app.get('/assets/<path:filename>')
    def project_asset(filename: str):
        return send_from_directory(ASSETS_DIR, filename)

    @app.get('/api/config')
    def api_config():
        config = dict(get_ui_config())
        config['ruleImages'] = config['ruleImages'] if web_mode.show_rule_images else []
        config['folders'] = config['folders'] if web_mode.allow_folder_actions else []
        config['uiFlags'] = {
            'publicWeb': web_mode.public_web,
            'showRuleImages': web_mode.show_rule_images,
            'allowFolderActions': web_mode.allow_folder_actions,
        }
        return jsonify(config)

    @app.post('/api/analyze')
    def api_analyze():
        payload = request.get_json(silent=True) or {}
        inputs = parse_analysis_input(payload)
        result = run_analysis(inputs)
        response = result_to_payload(result)
        return jsonify(response)

    @app.post('/api/open-folder')
    def api_open_folder():
        if not web_mode.allow_folder_actions:
            return jsonify({'ok': False, 'message': '公网模式不提供本地目录操作。'}), 403
        payload = request.get_json(silent=True) or {}
        folder_key = str(payload.get('folderKey') or '')
        folder_path = FOLDER_MAP.get(folder_key)
        if folder_path is None or not folder_path.exists():
            return jsonify({'ok': False, 'message': '目录不存在。'}), 404
        try:
            os.startfile(str(folder_path))
            return jsonify({'ok': True})
        except Exception as exc:
            return jsonify({'ok': False, 'message': str(exc)}), 500

    @app.get('/rule-image/<path:relative_path>')
    def rule_image(relative_path: str):
        if not web_mode.show_rule_images:
            abort(404)
        target_path = (PROJECT_ROOT / relative_path).resolve()
        if PROJECT_ROOT.resolve() not in target_path.parents and target_path != PROJECT_ROOT.resolve():
            return jsonify({'ok': False, 'message': '非法路径。'}), 400
        if not target_path.exists() or not target_path.is_file():
            return jsonify({'ok': False, 'message': '文件不存在。'}), 404
        return send_file(target_path)

    return app


def _pick_port(preferred_port: int = 8765) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as preferred_socket:
        preferred_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            preferred_socket.bind(('127.0.0.1', preferred_port))
        except OSError:
            pass
        else:
            return preferred_port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as fallback_socket:
        fallback_socket.bind(('127.0.0.1', 0))
        return int(fallback_socket.getsockname()[1])


def run_local_server(open_browser: bool = True, port: int | None = None) -> None:
    port = _pick_port() if port is None else int(port)
    app = create_app(public_web=False)
    url = f'http://127.0.0.1:{port}'
    if open_browser:
        threading.Timer(0.7, lambda: webbrowser.open(url, new=1)).start()
    print(f'伤害机制测试已启动：{url}')
    app.run(host='127.0.0.1', port=port, debug=False, use_reloader=False)


def run_public_server(host: str | None = None, port: int | None = None) -> None:
    resolved_host = str(host or os.getenv('HOST') or '0.0.0.0')
    resolved_port = int(port or os.getenv('PORT') or 8000)
    app = create_app(public_web=True)
    print(f'伤害机制测试公网模式已启动：http://{resolved_host}:{resolved_port}')
    app.run(host=resolved_host, port=resolved_port, debug=False, use_reloader=False)


def main() -> None:
    run_local_server(open_browser=True)


if __name__ == '__main__':
    main()