# Streamlit를 HTTPS로 연결하기

여기서는 Streamlit을 https를 이용하기 위하여 CloudFront - ALB - EC2로 구성하는 방법을 설명합니다. 

## System Architecture 

이때의 Architecture는 아래와 같습니다. 여기서에서는 Streamlit이 설치된 EC2는 private subnet에 둬서 안전하게 관리합니다. 

![image](https://github.com/user-attachments/assets/5303bdc1-4b69-4421-9fb8-148b1ba2828c)



### CDK 구현 코드

EC2를 아래와 같이 정의합니다. 

```java
const appInstance = new ec2.Instance(this, `app-for-${projectName}`, {
    instanceName: `app-for-${projectName}`,
    instanceType: new ec2.InstanceType('t2.small'), // m5.large
    machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023
    }),
    vpc: vpc,
    vpcSubnets: {
        subnets: vpc.privateSubnets 
    },
    securityGroup: ec2Sg,
    role: ec2Role,
    userData: userData,
    blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(8, {
            deleteOnTermination: true,
            encrypted: true,
        }),
    }],
    detailedMonitoring: true,
    instanceInitiatedShutdownBehavior: ec2.InstanceInitiatedShutdownBehavior.TERMINATE,
});
appInstance.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
```

EC2의 userdata는 아래와 같이 설정합니다.

```java
commands = [
 'yum install git python-pip -y',
 'pip install pip --upgrade',            
 `sh -c "cat <<EOF > /etc/systemd/system/streamlit.service
[Unit]
Description=Streamlit
After=network-online.target

[Service]
User=ec2-user
Group=ec2-user
Restart=always
ExecStart=/home/ec2-user/.local/bin/streamlit run /home/ec2-user/llm-streamlit/application/app.py

[Install]
WantedBy=multi-user.target
EOF"`,
 `runuser -l ec2-user -c 'cd && git clone https://github.com/kyopark2014/llm-streamlit'`,
 `runuser -l ec2-user -c 'pip install streamlit boto3'`,
 'systemctl enable streamlit.service',
 'systemctl start streamlit'
];

userData.addCommands(...commands);
```

ALB와 EC2를 연결합니다.

```java
const alb = new elbv2.ApplicationLoadBalancer(this, `alb-for-${projectName}`, {
  internetFacing: true,
  vpc: vpc,
  vpcSubnets: {
    subnets: vpc.publicSubnets
  },
  securityGroup: albSg,
  loadBalancerName: `alb-for-${projectName}`
})
alb.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

const listener = alb.addListener(`HttpListener-for-${projectName}`, {   
  port: 80,
  protocol: elbv2.ApplicationProtocol.HTTP,      
}); 

listener.addTargets(`WebEc2Target-for-${projectName}`, {
  targets,
  protocol: elbv2.ApplicationProtocol.HTTP,
  port: targetPort
}) 
```

EC2에는 [Console-EC2](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#Instances:)에 접속하여 "app-for-llm-streamlit"를 선택한 후에 Connect - Sesseion Manager를 선택하여 접속합니다. github에서 app을 업데이트 한 경우에 아래 명령어로 업데이트 합니다. 

```text
sudo runuser -l ec2-user -c 'cd /home/ec2-user/llm-streamlit && git pull'
```

Streamlit의 동작 상태는 아래 명령어를 이용해 확인합니다.

```text
sudo systemctl status streamlit -l
```

### htts로 streamlit 연결의 어려움

ALB에 인증서를 추가해서 https 지원이 가능하나, 여기에서는 CloudFront와 API Gateway(http api)를 이용하여 https 방식의 streamlit 구현을 시도하였습니다. 그러나, CloudFront와 API Gateway (http api)는 websocket을 지원하지 않으므로 구현이 안되는것을 확인하였습니다. 

- [Serverless Streamlit app on AWS with HTTPS](https://kawsaur.medium.com/serverless-streamlit-app-on-aws-with-https-b5e5ff889590)

- [frontend_stack.py](https://github.com/kawsark/streamlit-serverless/blob/main/streamlit_serverless_app/frontend_stack.py)

- [Running streamlit as a System Service](https://medium.com/@stevenjlm/running-streamlit-on-amazon-ec2-with-https-f20e38fffbe7)



## Streamlit

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


### 예제

#### Title
title, head, subheader는 아래와 같이 사용합니다.

```python
st.title('this is title')
st.header('this is header')
st.subheader('this is subheader')
```

#### 입력창

```python
input_text = st.text_input('**Chat with me**', key='text')
```

## 설치 및 실행

### Resorces의 삭제

[Endpoints Console](https://us-west-2.console.aws.amazon.com/vpcconsole/home?region=us-west-2#Endpoints:)에서 vpce를 삭제합니다.


## Reference 

[Amazon Bedrock Knowledge base로 30분 만에 멀티모달 RAG 챗봇 구축하기 실전 가이드](https://aws.amazon.com/ko/blogs/tech/practical-guide-for-bedrock-kb-multimodal-chatbot/)

[CDK-Ubuntu Steamlit](https://github.com/aws-samples/kr-tech-blog-sample-code/tree/main/cdk_bedrock_rag_chatbot/lib)

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
