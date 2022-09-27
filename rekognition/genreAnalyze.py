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
    startJobId = 'null'

    sqsQueueUrl = 'https://sqs.ap-northeast-2.amazonaws.com/392553513869/allonsyQueue' #
    snsTopicArn = 'arn:aws:sns:ap-northeast-2:392553513869:allonsySNS' #
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
            sqsResponse = self.sqs.receive_message(QueueUrl=self.sqsQueueUrl, MessageAttributeNames=['ALL'],
                                                   MaxNumberOfMessages=10)
            # print(sqsResponse)
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
                     #   print("Matching JobId 아님 :" +
                      #        str(rekMessage['JobId']) + ' : ' + self.startJobId)
                        # Delete the unknown message. Consider sending to dead letter queue
                    self.sqs.delete_message(QueueUrl=self.sqsQueueUrl,
                                            ReceiptHandle=message['ReceiptHandle'])
        return succeeded

    def GetLabelDetectionResults(self, second):
        # Animation, Action,Adventure, Comedy, Drama,  Romance, Fantasy, Family, Science Fiction, Horror
        genreList = []
        second = int(second/1000)
        maxResults = 10
        paginationToken = ''
        finished = False
        sf = ['Aircraft', 'Sky','Sunrise','Overwatch','Universe','Space']
        adventure = ['Train','Vehicle','Transportation','Nature']
        animation = ['Comics','Manga']
        fscount = 0 # 3 이상되면 sf 장르로 분류
        adventurecount = 0
        animationcount = 0

        while finished == False:
            response = self.rek.get_label_detection(JobId=self.startJobId, MaxResults=maxResults,
                                                    NextToken=paginationToken, SortBy='TIMESTAMP') # 시간순으로 정렬, SortBy TIMESTAMP

            for labelDetection in response['Labels']:
                if labelDetection['Timestamp']/1000>=5:
                    last = second-5

                    if int(labelDetection['Timestamp']/1000)<=second+5 and int(labelDetection['Timestamp']/1000)>=last:
                        label = labelDetection['Label']
                        #print(label['Name'])
                        if label['Name'] in sf:
                            fscount+=1
                        if label['Name'] in adventure:
                            adventurecount+=1
                        if label['Name'] in animation:
                            animationcount+=1
                    else:
                        continue

            if 'NextToken' in response:
                paginationToken = response['NextToken']
            else:
                finished = True

        if(fscount>=3):
            genreList.append('sf')
        if (adventurecount >= 3):
            genreList.append('adventure')
        if (animationcount>=1):
            genreList.append('animation')
        print(genreList)

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

    def StartDetection1(self):
        # 사물 인식 아이디 발급
        response1 = self.rek.start_label_detection(Video={'S3Object': {'Bucket': self.bucket, 'Name': self.video}},
                                                  NotificationChannel={'RoleArn': self.roleArn,
                                                                       'SNSTopicArn': self.snsTopicArn})
        self.startJobId = response1['JobId']


def main(second,movieFileName):
    roleArn = 'arn:aws:iam::392553513869:role/serviceRekognition'
    bucket = 'allonsybucket1'
    video = movieFileName

    analyzer = VideoDetect(roleArn, bucket, video)
    #analyzer.CreateTopicandQueue()

    analyzer.StartDetection1()
    if analyzer.GetSQSMessageSuccess() == True:
        analyzer.GetLabelDetectionResults(int(second))  # 25초에 사용자 감정의 폭 Max
    #analyzer.DeleteTopicandQueue()

if __name__ == "__main__":
    main(sys.argv[1],sys.argv[2])