# birds-in-your-area
iNaturalist observation map for casual birders and critter enjoyers.

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

3. Install prerequisites 

```bash
pip install -r requirements.txt 
```

4. Create SSL Certificate
```bash
certtool -p --key-type=rsa --bits=4096 --no-text --outfile=key.pem
certtool -s --load-privkey key.pem --no-text --outfile=cert.pem
```

5. Change run script's permission
```bash
chmod +x run
```

6. Run Gunicorn
```bash
#For "prod" mode 
./run
#For dev mode
./run --dev 
```


## Todo
- [ ] Species info page