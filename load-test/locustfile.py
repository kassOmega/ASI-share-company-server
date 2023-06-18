from locust import HttpUser, task
from random import randint

class HelloWorldUser(HttpUser):

    @task
    def hello_world(self):
        res = self.client.post("api/admin/login", json={'userName': 'tame@asi', 'password': 'tame@1234'})
        res = res.json()
        token = res['token']
        promised = randint(1,200)
        paid=randint(1,promised)
        data = {
            'fullName': f'Abebe_{randint(1,10000)}',
            'phoneNumber': '091981072',
            'address': 'address',
            'password': 'password',
            'userName': f'{randint(1,10000)}_user',
            'totalSharePromised': promised,
            'totalSharePaid':  paid,
        }
        print(data)
        self.client.post('api/admin/customer', json=data, headers={'Authorization': token})


        