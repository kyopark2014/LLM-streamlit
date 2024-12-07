# Amazon Bedrock을 위한 Streamlit 환경 구성 

아래 내용은 라이브러리등이 너무 오래돼서 아래를 참조하는것이 더 좋을것 같습니다.

[CDK Example](https://github.com/aws-samples/kr-tech-blog-sample-code/tree/main/cdk_bedrock_rag_chatbot/lib)

[Amazon Bedrock Knowledge base로 30분 만에 멀티모달 RAG 챗봇 구축하기 실전 가이드](https://aws.amazon.com/ko/blogs/tech/practical-guide-for-bedrock-kb-multimodal-chatbot/)

<img src="https://github.com/user-attachments/assets/1ae3d25b-fb9d-4109-8b87-b7a85bd8b795" width="700">

## htts로 streamlit 연결하기

[Serverless Streamlit app on AWS with HTTPS](https://kawsaur.medium.com/serverless-streamlit-app-on-aws-with-https-b5e5ff889590)를 참조합니다. 이 repo를 보면 CloudFront뒤에 ALB를 놓고 포트를 80으로 열고 있습니다.

[frontend_stack.py](https://github.com/kawsark/streamlit-serverless/blob/main/streamlit_serverless_app/frontend_stack.py)에서는 아래와 같이 origin을 정의합니다. 

```python
origin=origins.LoadBalancerV2Origin(fargate_service.load_balancer, 
 protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY, 
 http_port=80, 
 origin_path="/", 
 custom_headers = { custom_header_name : custom_header_value } ),
```

CloudFront - ALB - EC2로 하면 외부에서 cloudfront의 domain으로 접속시 https로 접속하게 됩니다.

## streamlit을 system으로 실행

[Running streamlit as a System Service](https://medium.com/@stevenjlm/running-streamlit-on-amazon-ec2-with-https-f20e38fffbe7)와 같이 service로 사용합니다.



## 설치 및 실행





### Cloud9 실행환경

[Cloud9 console](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/)에서 [Create environment]를 선택하여 Cloud9을 생성합니다.

[EC2 Console](https://ap-northeast-2.console.aws.amazon.com/ec2/home?region=ap-northeast-2#Instances:instanceState=running)에서 Cloud9이 설치된 EC2를 찾은 후에, 아래와 같이 Security Group의 inbound rule에서 8501을 Open합니다.

![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/1a451dd0-92d3-465e-80e2-144c0fa65d8b)

### EBS 크기 변경

아래와 같이 스크립트를 다운로드 합니다. 

```text
curl https://raw.githubusercontent.com/kyopark2014/technical-summary/main/resize.sh -o resize.sh
```

이후 아래 명령어로 용량을 100G로 변경합니다.
```text
chmod a+rx resize.sh && ./resize.sh 100
```

### Bedrock 환경 설정

소스를 다운로드합니다.

```text
git clone https://github.com/kyopark2014/LLM-streamlit && cd LLM-streamlit/app
```


```text
wget https://db3lw8u6vdvwu.cloudfront.net/bedrock/bedrock-python-sdk.zip &&
unzip bedrock-python-sdk.zip -d bedrock-sdk &&
pip install -U ./bedrock-sdk/botocore-1.29.162-py3-none-any.whl -t . &&
pip install -U ./bedrock-sdk/boto3-1.26.162-py3-none-any.whl &&
pip install -U ./bedrock-sdk/awscli-1.27.162-py3-none-any.whl &&
pip install -U langchain &&
rm -rf bedrock-sdk
```

pydantic을 다운 grade합니다. ([참고](https://stackoverflow.com/questions/76614379/roo-validator-error-when-importing-langchain-text-splitter-python))
```text
pip install pydantic==1.10.2
```

### Streamlit 실행 

streamlit을 설치합니다.

```text
pip install streamlit && pip install streamlit_chat
```

아래와 같이 streamlit을 실행합니다.

```text
streamlit run titan.py
```

아래의 External URL을 브라우저를 이용해 접속합니다.

```text
  You can now view your Streamlit app in your browser.

  Network URL: http://172.31.46.12:8501
  External URL: http://3.39.22.83:8501
```

이후, [titan.py](./app/titan.py)를 열어서 수정을 한 후에 저정하면 됩니다. 결과 업데이트는 브라우저를 reflash하면 됩니다. 실행화면은 아래와 같습니다.

![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/aa63a2c2-942e-4234-9928-d051f70e3a63)


## 예제

### Title
title, head, subheader는 아래와 같이 사용합니다.

```python
st.title('this is title')
st.header('this is header')
st.subheader('this is subheader')
```

이때의 결과는 아래와 같습니다.

![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/e0f94a88-8f58-4ebd-9e5f-966085621114)

### 입력창

```python
input_text = st.text_input('**Chat with me**', key='text')
```

## Troubleshooting: EC2에서 Bedrock과 LangChain 사용시 문제점

- 2023년 7월 기준으로 Bedrock용 라이브러리는 python3.7기준(amazon linux)로 설정되어 있습니다.
- LangChaing은 python3.7 기준에서 0.0.27까지만 지원하므로 최신 라이브러리는 거의 사용할 수 없으모로 python3.9 사용이 권고됩니다.
- EC2(Amazon linux)로 python3.9를 추가로 설치하고 python 버전을 확인하였을대 3.9로 잘 설치되었으나 pip install lanagchin으로 langchain 설치시에 여전히 python 3.7 버전을 인식함
- 따라서, EC2(Amazon linux)에서 Bedrock과 LangChain 동시 사용이 불가합니다.
- EC2(Ubuntu)로 설치시에 python 3.10이 기본설치되지만, Bedrock installer가 python 3.7 기준이라서 설치가 불가하여 Ubuntu에서는 Bedrock 사용이 불가합니다.
- container로 만들어서 사용이 가능할것으로 보여지지만, Cloud9 환경 사용이 불가하여 Bedrock 정식 버전이 출시 되기 까지는 사용이 불가할것으로 보여집니다. 

```text
sudo yum install gcc openssl-devel bzip2-devel libffi-devel 
cd /opt 
sudo tar xzf Python-3.9.16.tgz 
sudo wget https://www.python.org/ftp/python/3.9.16/Python-3.9.16.tgz 
sudo ./configure --enable-optimizations 
sudo make altinstall 
sudo rm -f /opt/Python-3.9.16.tgz 
python3.9 -V 

- python3.9를 enable
python3.9 -m venv env

- 경로 확인
which python3.9
/opt/Python-3.9.16/env/bin/python3.9

- 확인된 경로로 update
sudo update-alternatives --install /usr/bin/python python /opt/Python-3.9.16/env/bin/python3.9 1 
sudo update-alternatives --config python

There is 1 program that provides 'python'.

  Selection    Command
-----------------------------------------------
*+ 1           /opt/Python-3.9.16/env/bin/python3.9

Enter to keep the current selection[+], or type selection number: 1

- 버전확인
python --version
python3 --version
```

추가적으로 버전 변경
[AWS cloud9 pip install goes to python 2.7 instead of 3.6](https://stackoverflow.com/questions/60076259/aws-cloud9-pip-install-goes-to-python-2-7-instead-of-3-6)d에 따라 아래와 같이 설치합니다.

```text
unalias python
sudo python3 -m pip install --upgrade pip
```

## Reference 

[Github - Welcome to Streamlit](https://github.com/streamlit/streamlit)

[Streamlit cheat sheet](https://daniellewisdl-streamlit-cheat-sheet-app-ytm9sg.streamlit.app/)

[CDK-Instance](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Instance.html)

[CDK-LoadBalancer](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_elasticloadbalancing.LoadBalancer.html)

[CDK-VPC](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html)

[CDK-VpcEndpoint](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.VpcEndpoint.html)

[EC2에 간단한 Streamlit 웹 서비스 올리기](https://everenew.tistory.com/317)

[Deploying Streamlit Application on AWS EC2 Instance with NGINX Server](https://medium.com/@borghareshubham510/deploying-streamlit-application-on-aws-ec2-instances-with-nginx-server-d20c83bf150a)

[How to Deploy a Streamlit Application on Amazon Linux EC2](https://towardsaws.com/how-to-deploy-a-streamlit-application-on-amazon-linux-ec2-9a71593b434)

[Running Streamlit on Amazon EC2 with HTTPS](https://medium.com/@stevenjlm/running-streamlit-on-amazon-ec2-with-https-f20e38fffbe7)

[Setting up a VPC Endpoint for yum with AWS CDK](https://dev.to/jhashimoto/setting-up-a-vpc-endpoint-for-yum-with-aws-cdk-3a8o)

[CloudFront - ALB 구성 시 보안 강화 방안](https://everenew.tistory.com/317)

[자습서: Amazon ECS 서비스에 대한 프라이빗 통합을 통해 HTTP API 생성](https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/http-api-private-integration.html)

[API Gateway to ECS Fargate cluster](https://serverlessland.com/patterns/apigw-vpclink-pvt-alb?ref=search)
