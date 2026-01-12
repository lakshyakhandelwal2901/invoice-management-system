from __future__ import annotations
import sys
from PySide6 import QtWidgets, QtGui
from app.ui.main_window import MainWindow


def main():
    app = QtWidgets.QApplication(sys.argv)
    app.setApplicationName("Invoice Management System (Python)")
    # Load QSS
    try:
        with open("app/theme/style.qss", "r", encoding="utf-8") as f:
            app.setStyleSheet(f.read())
    except Exception:
        pass

    # Optional: load font if available
    # QtGui.QFontDatabase.addApplicationFont("app/assets/Inter-Regular.ttf")

    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
