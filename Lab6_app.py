from flask import Flask, jsonify, request
#import Lab6_db_connector as Lab6_db_connector
import mysql.connector
from dotenv import load_dotenv
import os

app = Flask(__name__)

#load_dotenv()

#DB_USER = os.getenv("DB_ROOT")
#DB_PASSWORD = os.getenv("DB_PASSWORD")
#DB_HOST = os.getenv("DB_HOST")

#connection = mysql.connector.connect(
#        host = "DB_HOST",
#        user = "DB_USER",
#        password = "DB_PASSWORD",
#        database = "DB_NAME"
#    )

@app.route('', methods=[''])
def register_user():
    pass

@app.route('', methods=[''])
def login(customer_id):
    pass

@app.route('', methods=[''])
def create_user():
    pass

@app.route('', methods=[''])
def retrieve_courses():
    pass
    
@app.route('', methods=[''])
def register_for_course():
    pass

@app.route('', methods=[''])
def retrieve_participants():
    pass

@app.route('', methods=[''])
def retrieve_calender_events():
    pass

@app.route('', methods=[''])
def create_calender_events():
    pass

@app.route('', methods=[''])
def forum():
    pass

@app.route('', methods=[''])
def discussion_thread():
    pass

@app.route('', methods=[''])
def course_container():
    pass

@app.route('', methods=[''])
def assignments():
    pass

@app.route('', methods=[''])
def reports():
    pass