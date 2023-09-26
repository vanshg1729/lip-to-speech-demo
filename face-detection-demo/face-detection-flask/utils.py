import numpy as np
from detector import base64_to_image, image_to_base64
from PIL import Image, ImageDraw, ImageFont

def draw_text_np_image(img, sentence, coordinates=(0, 0), color=(255, 255, 255)):
    # https://stackoverflow.com/questions/16373425/add-text-on-image-using-pil
    img_pil = Image.fromarray(img)
    # create the draw object from the pil image
    draw = ImageDraw.Draw(img_pil)
    # draw the sentence to the pil image
    draw.text(coordinates, sentence, color)
    # convert back to numpy array
    img = np.array(img_pil)
    return img

def add_text_batchdata(batchdata, sentence):
    # get all the frames
    frames = batchdata.get('frames', None)
    if frames == None:
        print('frames is None')
        return batchdata
    
    # enumerate over all the frames
    for i, framedata in enumerate(frames):
        dataurl = framedata.get('url', None)
        if dataurl == None:
            continue

        # drawing the text on the image
        img_np = base64_to_image(dataurl)
        img_np = draw_text_np_image(img_np, sentence, coordinates=(100, 170))
        # converting numpy image back to dataurl
        dataurl = image_to_base64(img_np)

        # updating the frame dataurl in batchdata
        batchdata['frames'][i]['url'] = dataurl
    
    return batchdata