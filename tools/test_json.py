import json

if __name__ == '__main__':
    with open('executed.json') as f:
        try:
              json.load(f)
        except Error as e:
              print (e)
