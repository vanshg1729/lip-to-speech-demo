from flask import Flask, request
from flask_cors import CORS
from markupsafe import escape
import matplotlib.pyplot as plt
import copy
import pickle

from utils import add_text_batchdata

from detector import detect_faces_from_dataurl, detect_faces_from_framedata
from detector import get_frames_from_batchdata
from detector import detect_faces_from_batchdata
from detector import numpy_array_to_dataurl
from detector import base64_to_image, image_to_base64

from flask_funcs import process_frame, inference

app = Flask(__name__)
CORS(app)
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
        return {"message": "pass"}

    dataurl = data['url']
    print(f"Length of data_url = {len(dataurl)}")
    return {"message": "pass"}


@app.post("/detect_faces/")
def detect_faces():
    print("inside detect_faces() function")

    # if request.is_json:
    #     print("request is json")
    # else:
    #     print("Request is not json")

    # printing some debug information
    mimetype = request.mimetype
    content_type = request.content_type
    host = request.host
    # print(f"request mimetype = {mimetype}")
    # print(f"request content_type = {content_type}")
    # print(f"request host : {host}")

    # getting the json data from the request
    framedata = request.get_json()

    if framedata == None:
        print("data is none")
        return None

    framedata = detect_faces_from_framedata(framedata)

    return framedata

    # # getting the base64 encoded image string
    # dataurl = data.get('url', None)
    # if dataurl == None:
    #     print("dataurl is None")
    #     return None

    # print(f"Length of incoming dataurl = {len(dataurl)}")
    # new_data = copy.deepcopy(data)

    # #image = base64_to_image(dataurl)
    # #print(f"Length of incoming image: {image.shape}")

    # # getting the annotated image with bounding boxes
    # annotated_image = detect_faces_from_dataurl(dataurl)

    # # converting the image to base64 encoded string
    # processed_img_data = image_to_base64(annotated_image)
    # print(f"Length of processed dataurl: {len(processed_img_data)}")

    # # return the encoded image string
    # new_data["url"] = processed_img_data
    # return new_data


@app.post("/detect_faces_batch/")
def detect_faces_batch():
    print("inside detect_faces_batch() function")

    # if request.is_json:
    #     print("request is json")
    # else:
    #     print("Request is not json")

    # # printing some debug information
    # mimetype = request.mimetype
    # content_type = request.content_type
    # host = request.host
    # print(f"request mimetype = {mimetype}")
    # print(f"request content_type = {content_type}")
    # print(f"request host : {host}")

    # getting the json data from the request
    batchdata = request.get_json()

    if batchdata == None:
        print("data is none")
        return None

    batchdata = detect_faces_from_batchdata(batchdata)
    return batchdata

@app.post("/lip_reading/")
def read_lips():
    print("inside read_lips() function")

    # getting the json data from the request
    batchdata = request.get_json()

    if batchdata == None:
        print("data is none")
        return None

    # preparing the data for model inference
    frames = get_frames_from_batchdata(batchdata)
    frames_tensor = process_frame(frames)

    sentence = inference(frames_tensor)
    batchdata["sentence"] = sentence
    batchdata = add_text_batchdata(batchdata, sentence)

    return batchdata