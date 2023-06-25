# Face Detection using Flask

## Installation
Cd to the `face-detection-flak` directory and 
[create a conda environment](https://conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#creating-an-environment-from-an-environment-yml-file) 
using the `environment.yml`. file like this:
```
conda env create -f environment.yml
```
This should create a conda environment with all the python requirements. The name 
of the environment will be set to `face-detection-flask`.

After creating the environment, you must 
[activate the conda environment](https://conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#activating-an-environment)
using :
```
conda activate face-detection-flask
```

## Starting the Flask server
To start the server, run the following command:
```
flask --app app.py run --debugger
```
This will start a server running at `http://localhost:5000/`

## Getting the images with bounding box for faces
To get the output from the api, you must send a request at `http://localhost:5000/detect_faces/`
with json data in the following format:
```
{"url" : dataurl}
```
where `dataurl` must contain [Data URL](https://developer.mozilla.org/en-US/docs/web/http/basics_of_http/data_urls)
of the image. You will get a response also in the same json format but now
the image will contain red bounding boxes for the detected faces in the
image.
