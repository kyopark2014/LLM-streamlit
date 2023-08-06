# Cloud9에 Streamlit 설치를 위한 환경 설정

여기서는 Streamlit을 Cloud9에서 사용하기 위한 설정방법을 가이드합니다.

=> Cloud9이 python2.7을 반드시 필요로하는데 Amazon Linux에서 설치하는 방법을 못찾아서 헤메고 있음 (Aug.6 2023)

## EC2 생성 

[EC2 console](https://ap-northeast-2.console.aws.amazon.com/ec2/home?region=ap-northeast-2#LaunchInstances:)에 접속하여 [Name]으로 "streamlit"으로 입력하고, OS로 기본값인 "Amazon linux"를 선택합니다.  

[Amazon Machine Image (AMI)]은 최신 AMI를 선택합니다. 여기서는 기본값인 "Amazon Linux 2023 AMI"를 선택하였습니다.

적절한 [Instance type]을 선택합니다. 여기서는 "m5-2xlarge"를 선택하였습니다.

[Key pair]는 아래와 같이 "Proceed without a key pair"를 선택합니다.
![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/7e60cbcd-2d0a-48ad-b5f9-cee5a7fb67e1)

편의상 [Configure storage]를 200GiB로 선택합니다. 

이후 [Launch instance]를 선택합니다.

## Cloud9 생성

[Cloud9 Console](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/create)에서 아래와 같이 [Name]을 입력하고, [Existing compute]를 선택한 후에 [Copy key to clipboard]를 선택하여 ssh key를 복사합니다. 여기서는 Name으로 "streamlit"라고 입력하였습니다. 

![noname](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/a9e30612-06bb-464d-9e47-8e0df29f9036)


[EC2 Console](https://ap-northeast-2.console.aws.amazon.com/ec2/home?region=ap-northeast-2#Instances:)로 이동하여, 생성한 EC2를 선택하고 먼저, "Public IPv4 DNS"의 값을 확인합니다. 여기서는, "3.38.175.246"입니다. 이후 아래처럼 생성한 인스턴스를 선택하고, [Connect]를 선택합니다. 

![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/f4057a4a-b024-4b65-8152-14835fcb5191)


아래와 같이 [Connect to instances]에서 [Connect]를 선택합니다. 

![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/3994c9b5-6a3d-40a8-9650-601c3cfa6ed0)


기존의 authorized_keys를 삭제합니다.

```java
rm .ssh/authorized_keys
```

이제 authorized_keys에 Cloud9에서 복사한 ssh key를 입력합니다. 

```java
echo <Paste the Copied Key> >> ~/.ssh/authorized_keys
```


아래와 같이 정상적으로 입력되었는지 확인합니다.

```java
cat ~/.ssh/authorized_keys
```

여기서는 아래처럼 확인할 수 있습니다. 

![noname](https://user-images.githubusercontent.com/52392004/216789211-ed1ceb16-7f82-4416-b04e-8145d59b8936.png)


아래와 같이 [node.js를 설치](https://docs.aws.amazon.com/ko_kr/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html)합니다.

```text
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
. ~/.nvm/nvm.sh
nvm install --lts
node -e "console.log('Running Node.js ' + process.version)"
```


아래와 같이 pip python2.7을 설치합니다.

[찾는중...]



다시 Cloud9으로 와서 [User]에 "ec2-user"라고 입력하고, 생성한 EC2의 Public IP를 아래처럼 입력합니다. 이후 하단의 [Create]를 선택하여 Cloud9을 선택합니다. 

![noname](https://user-images.githubusercontent.com/52392004/216789657-ad99aa12-e531-4566-a02e-f1adae46e4c9.png)



아래와 같이 [Environment](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/)에서 생성한 "streamlit"에서 [Open]을 선택하여 cloud9으로 진입합니다. 

![noname](https://user-images.githubusercontent.com/52392004/216733393-1635c558-35a8-4ba6-b177-fb4bea3ac701.png)

아래와 같은 설치 화면이 나오면 [Next]를 선택합니다.

![image](https://user-images.githubusercontent.com/52392004/216662019-28f065d7-88a5-4ad5-8182-9362751a63d9.png)

아래와 같이 Installer에서도 [Next]를 선택하여 필요한 패키지를 설치합니다. 수분정도 소요됩니다. 

![image](https://user-images.githubusercontent.com/52392004/216662159-5ff76f78-7beb-4365-871e-dbbd4d23e912.png)

설치가 완료되면 아래와 같이 터미널로 접속합니다. 

![noname](https://user-images.githubusercontent.com/52392004/216664493-8fa9c618-8ab1-4ea1-8563-74a94ee27aef.png)



![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/753debfd-ea3a-4ec9-bfad-38174158362d)
