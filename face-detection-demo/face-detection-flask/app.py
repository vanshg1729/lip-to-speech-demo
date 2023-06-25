from flask import Flask, request
from markupsafe import escape
import matplotlib.pyplot as plt

from detector import detect_faces_from_dataurl
from detector import numpy_array_to_dataurl
from detector import base64_to_image, image_to_base64

app = Flask(__name__)
# ref : https://python.plainenglish.io/real-time-image-processing-using-websockets-and-flask-in-python-and-javascript-97fb4a0a764f

@app.route("/")
def index():
    return 'Index Page'

@app.post("/test/")
def test_fun():
    print("inside test_fun function")
    if request.is_json:
        print("request is json")
    else:
        print("Request is not json")

    mimetype = request.mimetype
    content_type = request.content_type
    host = request.host
    print(f"request mimetype = {mimetype}")
    print(f"request content_type = {content_type}")
    print(f"request host : {host}")

    data = request.get_json(force=True, silent=True)

    if data == None:
        print("data is none")
        return {"message" : "pass"}

    dataurl = data['url']
    print(f"Length of data_url = {len(dataurl)}")
    return {"message" : "pass"}

def test_detect_faces():
    data = request.get_json()
    dataurl = data['url']
    print(len(dataurl))
    original_image = base64_to_image(dataurl)
    print(original_image.shape)
    annotated_image = detect_faces_from_dataurl(dataurl)
    print(annotated_image.shape)
    annotated_dataurl = numpy_array_to_dataurl(annotated_image)
    print(len(annotated_dataurl))
    return annotated_dataurl

@app.post("/detect_faces/")
def detect_faces():
    print("inside detect_faces() function")
    if request.is_json:
        print("request is json")
    else:
        print("Request is not json")

    # printing some debug information
    mimetype = request.mimetype
    content_type = request.content_type
    host = request.host
    print(f"request mimetype = {mimetype}")
    print(f"request content_type = {content_type}")
    print(f"request host : {host}")

    # getting the json data from the request
    data = request.get_json()

    if data == None:
        print("data is none")
        return None

    # getting the base64 encoded image string
    dataurl = data.get('url', None)
    if dataurl == None:
        print("dataurl is None")
        return None

    print(f"Length of incoming dataurl = {len(dataurl)}")

    #image = base64_to_image(dataurl)
    #print(f"Length of incoming image: {image.shape}")

    # getting the annotated image with bounding boxes
    annotated_image = detect_faces_from_dataurl(dataurl)

    # converting the image to base64 encoded string
    processed_img_data = image_to_base64(annotated_image)
    print(f"Length of processed dataurl: {len(processed_img_data)}")
    
    # return the encoded image string
    return {"url": processed_img_data}
