import boto3, json, sys, time, csv

class VideoDetect:
    jobId = 'null' # 비디오 분석 작업용 ID, 작업 식별자

    with open('credential/credentials.csv', 'r') as input:
        next(input)
        reader = csv.reader(input)
        for line in reader:
            access_key_id = line[0]
            secret_access_key = line[1]

    access_key_id = access_key_id
    secret_access_key = secret_access_key
    rek = boto3.client('rekognition', region_name='ap-northeast-2', aws_access_key_id=access_key_id, aws_secret_access_key=secret_access_key)
    sqs = boto3.client('sqs', region_name='ap-northeast-2', aws_access_key_id=access_key_id, aws_secret_access_key=secret_access_key)
    sns = boto3.client('sns', region_name='ap-northeast-2', aws_access_key_id=access_key_id, aws_secret_access_key=secret_access_key)

    roleArn = 'arn:aws:iam::392553513869:role/serviceRekognition'
    bucket = 'allonsybucket1'
    video = 'avengers.mp4'
    startJobId = 'null'

    sqsQueueUrl = 'https://sqs.ap-northeast-2.amazonaws.com/392553513869/allonsyQueue'
    snsTopicArn = 'arn:aws:sns:ap-northeast-2:392553513869:allonsySNS'
    processType = 'null'

    def __init__(self, role, bucket, video):
        self.roleArn = role
        self.bucket = bucket
        self.video = video

    def GetSQSMessageSuccess(self):
        jobFound = False
        succeeded = False
        dotLine = 0
        while jobFound == False:
            sqsResponse = self.sqs.receive_message(QueueUrl=self.sqsQueueUrl, MessageAttributeNames=['ALL'], MaxNumberOfMessages=10)
            #print(sqsResponse)
            if sqsResponse:
                if 'Messages' not in sqsResponse:
                    if dotLine < 40:
                        #print('.', end='')
                        dotLine = dotLine + 1
                    else:
                        #print()
                        dotLine = 0
                    sys.stdout.flush()
                    time.sleep(5)
                    continue

                for message in sqsResponse['Messages']:
                    notification = json.loads(message['Body'])
                    rekMessage = json.loads(notification['Message'])

                    if rekMessage['JobId'] == self.startJobId:
                        #print('Matching JobId 찾음! :' + rekMessage['JobId'])
                        jobFound = True
                        if (rekMessage['Status'] == 'SUCCEEDED'):
                            succeeded = True

                        self.sqs.delete_message(QueueUrl=self.sqsQueueUrl,
                                                ReceiptHandle=message['ReceiptHandle'])
                    #else:
                        #print("Matching JobId 아님 :" +
                         #     str(rekMessage['JobId']) + ' : ' + self.startJobId)
                        # Delete the unknown message. Consider sending to dead letter queue
                    self.sqs.delete_message(QueueUrl=self.sqsQueueUrl,
                                            ReceiptHandle=message['ReceiptHandle'])
        return succeeded

    def CreateTopicandQueue(self):

        millis = str(int(round(time.time() * 1000)))

        # Create SNS topic
        snsTopicName = "AmazonRekognitionExample" + millis

        topicResponse = self.sns.create_topic(Name=snsTopicName)
        self.snsTopicArn = topicResponse['TopicArn']

        # create SQS queue
        sqsQueueName = "AmazonRekognitionQueue" + millis
        self.sqs.create_queue(QueueName=sqsQueueName)
        self.sqsQueueUrl = self.sqs.get_queue_url(QueueName=sqsQueueName)['QueueUrl']

        attribs = self.sqs.get_queue_attributes(QueueUrl=self.sqsQueueUrl, AttributeNames=['QueueArn'])['Attributes']

        sqsQueueArn = attribs['QueueArn']

        # Subscribe SQS queue to SNS topic
        self.sns.subscribe(
            TopicArn=self.snsTopicArn,
            Protocol='sqs',
            Endpoint=sqsQueueArn)

        # Authorize SNS to write SQS queue
        policy = """{{
  "Version":"2012-10-17",
  "Statement":[
    {{
      "Sid":"MyPolicy",
      "Effect":"Allow",
      "Principal" : {{"AWS" : "*"}},
      "Action":"SQS:SendMessage",
      "Resource": "{}",
      "Condition":{{
        "ArnEquals":{{
          "aws:SourceArn": "{}"
        }}
      }}
    }}
  ]
}}""".format(sqsQueueArn, self.snsTopicArn)

        response = self.sqs.set_queue_attributes(
            QueueUrl=self.sqsQueueUrl,
            Attributes={
                'Policy': policy
            })

    def DeleteTopicandQueue(self):
        self.sqs.delete_queue(QueueUrl=self.sqsQueueUrl)
        self.sns.delete_topic(TopicArn=self.snsTopicArn)

    def StartDetection2(self):
        # 유명인 인식 아이디 발급
        response = self.rek.start_celebrity_recognition(
            Video={'S3Object': {'Bucket': self.bucket, 'Name': self.video}},
            NotificationChannel={'RoleArn': self.roleArn, 'SNSTopicArn': self.snsTopicArn})
        self.startJobId = response['JobId']

    def GetCelebrityDetectionResults(self,second):
        second = int(second / 1000)
        maxResults = 10
        paginationToken = ''
        finished = False
        celeblist = []
        while finished == False:
            response = self.rek.get_celebrity_recognition(JobId=self.startJobId, MaxResults=maxResults,NextToken=paginationToken)

            for celebrityRecognition in response['Celebrities']:
                if celebrityRecognition['Timestamp']/1000>=2:
                    last = second-2
                    if int(celebrityRecognition['Timestamp']/1000)<=second+2 and int(celebrityRecognition['Timestamp']/1000)>=last:
                        if str(celebrityRecognition['Celebrity']['Name']) not in celeblist:
                            name = str(celebrityRecognition['Celebrity']['Name'])
                            celeblist.append(name)
                    else:
                        continue
            if 'NextToken' in response:
                paginationToken = response['NextToken']
            else:
                finished = True
        print(celeblist)

def main():
    roleArn = 'arn:aws:iam::392553513869:role/serviceRekognition'
    bucket = 'allonsybucket1'
    video = 'avengers.mp4'

    analyzer = VideoDetect(roleArn, bucket, video)
    #analyzer.CreateTopicandQueue()

    analyzer.StartDetection2()
    if analyzer.GetSQSMessageSuccess() == True:
        analyzer.GetCelebrityDetectionResults(72333)  # 72초에 사용자 감정의 폭 Max

    #analyzer.DeleteTopicandQueue()

if __name__ == "__main__":
    main()