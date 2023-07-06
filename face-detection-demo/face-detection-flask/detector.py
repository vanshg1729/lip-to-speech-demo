from typing import Tuple, Union
import math
import re
import base64
import io

import cv2
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# STEP 1 : get the model path
model_path = './blaze_face_short_range.tflite'

# STEP 2: Create an FaceDetector object.
base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.FaceDetectorOptions(base_options=base_options)
detector = vision.FaceDetector.create_from_options(options)


def base64_to_image(base64_string):
    """
    Converts a base64 image string to a numpy image array
    """
    # Extract the base64 encoded binary data from the input string
    base64_data = re.search(r'base64,(.*)', base64_string).group(1)
    # Decode the base64 data to bytes
    image_bytes = base64.b64decode(base64_data)
    # convert the bytes to numpy array
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    # Decode the numpy array as an image using OpenCV
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    return image


def numpy_array_to_dataurl(img_arr):
    dataurl = base64.b64encode(img_arr)
    dataurl = f"data:image/jpeg;base64,{dataurl}"
    return dataurl


def image_to_base64(image):
    """
    converts a numpy image array to a base64 string
    """

    # Encode the processed image as a JPEG-encoded base64 string
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    result, frame_encoded = cv2.imencode(".jpg", image, encode_param)
    processed_img_data = base64.b64encode(frame_encoded).decode()

    # Prepend the base64-encoded string with the data url prefix
    b64_src = "data:image/jpg;base64,"
    processed_img_data = b64_src + processed_img_data
    return processed_img_data


def _normalized_to_pixel_coordinates(
        normalized_x: float, normalized_y: float, image_width: int,
        image_height: int) -> Union[None, Tuple[int, int]]:
    """Converts normalized value pair to pixel coordinates."""

    # Checks if the float value is between 0 and 1.
    def is_valid_normalized_value(value: float) -> bool:
        return (value > 0 or math.isclose(0, value)) and (value < 1 or
                                                          math.isclose(1, value))

    if not (is_valid_normalized_value(normalized_x) and
            is_valid_normalized_value(normalized_y)):
        # TODO: Draw coordinates even if it's outside of the image bounds.
        return None

    x_px = min(math.floor(normalized_x * image_width), image_width - 1)
    y_px = min(math.floor(normalized_y * image_height), image_height - 1)
    return x_px, y_px


def visualize(image,
              detection_result
              ) -> np.ndarray:
    """
    Draws bounding boxes and keypoints on the input image and return it.
      Args:
        image: The input RGB image.
        detection_result: The list of all "Detection" entities to be visualize.
      Returns:
        Image with bounding boxes.
    """
    MARGIN = 10  # pixels
    ROW_SIZE = 10  # pixels
    FONT_SIZE = 1
    FONT_THICKNESS = 1
    TEXT_COLOR = (0, 0, 255)  # red

    annotated_image = image.copy()
    height, width, _ = image.shape

    # ref : https://stackoverflow.com/questions/9823936/how-do-i-determine-what-type-of-exception-occurred
    try:
        for detection in detection_result.detections:
            # Draw bounding_box
            bbox = detection.bounding_box
            start_point = bbox.origin_x, bbox.origin_y
            end_point = bbox.origin_x + bbox.width, bbox.origin_y + bbox.height
            cv2.rectangle(annotated_image, start_point, end_point, TEXT_COLOR, 3)

        # Draw keypoints
        # for keypoint in detection.keypoints:
            # keypoint_px = _normalized_to_pixel_coordinates(keypoint.x, keypoint.y,
            # width, height)
            # color, thickness, radius = (0, 255, 0), 2, 2
            # cv2.circle(annotated_image, keypoint_px, thickness, color, radius)

        # Draw label and score
        category = detection.categories[0]
        category_name = category.category_name
        category_name = '' if category_name is None else category_name
        probability = round(category.score, 2)
        result_text = category_name + ' (' + str(probability) + ')'
        text_location = (MARGIN + bbox.origin_x,
                         MARGIN + ROW_SIZE + bbox.origin_y)
        cv2.putText(annotated_image, result_text, text_location, cv2.FONT_HERSHEY_PLAIN,
                    FONT_SIZE, TEXT_COLOR, FONT_THICKNESS)
    except UnboundLocalError as e:
        print(f"visualize(): An exception of type {type(e).__name__} occurred")
        print(f"visualize(): Probably no face was detected")

    return annotated_image


def detect_faces_from_dataurl(dataurl, detector=detector):
    numpy_image = base64_to_image(dataurl)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=numpy_image)

    detection_result = detector.detect(mp_image)
    image_copy = np.copy(mp_image.numpy_view())
    annotated_image = visualize(image_copy, detection_result)
    rgb_annotated_image = cv2.cvtColor(annotated_image, cv2.COLOR_BGR2RGB)
    return annotated_image


def detect_faces_from_framedata(framedata):

    # getting the base64 encoded image string
    dataurl = framedata.get('url', None)
    if dataurl == None:
        print("dataurl is None")
        return framedata

    # getting the annotated image with bounding boxes
    annotated_image = detect_faces_from_dataurl(dataurl)

    # converting the image to base64 encoded string
    processed_img_data = image_to_base64(annotated_image)

    framedata['url'] = processed_img_data
    return framedata

def detect_faces_from_batchdata(batchdata):
    frames = batchdata.get('frames', None)
    if frames == None:
        print('frames is None')
        return frames
    
    for i, framedata in enumerate(frames):
        framedata = detect_faces_from_framedata(framedata)
        batchdata['frames'][i] = framedata
    
    return batchdata


if __name__ == "__main__":
    IMAGE_FILE = './faces.png'
    model_path = './blaze_face_short_range.tflite'

    # STEP 2: Create an FaceDetector object.
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.FaceDetectorOptions(base_options=base_options)
    detector = vision.FaceDetector.create_from_options(options)

    image = mp.Image.create_from_file(IMAGE_FILE)

    detection_result = detector.detect(image)
    print(type(detection_result))

    image_copy = np.copy(image.numpy_view())
    annotated_image = visualize(image_copy, detection_result)
    rgb_annotated_image = cv2.cvtColor(annotated_image, cv2.COLOR_BGR2RGB)
    plt.imshow(annotated_image)
    plt.show()
