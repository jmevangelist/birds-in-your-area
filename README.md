# birds-in-your-area
iNaturalist observation map for casual birders and critter enjoyers.

![screenshot](screenshot.png)

## Built With
* Django
* Bootstrap 5
* OpenLayers
* iNaturalist API

## Setup
1. Clone the repo
```bash
git clone https://github.com/jmevangelist/birds-in-your-area.git
```

2. Create virtual environment and activate

```bash
cd birds-in-your-area
python3 -m venv /birdsInMyArea
source birdsInMyArea/bin/activate
```

3. Install python dependencies  

```bash
pip install -r requirements.txt 
```

4. Create SSL Certificate (optional)
```bash
certtool -p --key-type=rsa --bits=4096 --no-text --outfile=key.pem
certtool -s --load-privkey key.pem --no-text --outfile=cert.pem
```

5. Run
```bash
#For "prod" mode via Gunicorn
./run

# parameters
# --dev		dev mode
# --django 	run Django development server
```


## Todo
- [ ] Celery integration to throttle number of requests to iNat API
- [ ] Species info page