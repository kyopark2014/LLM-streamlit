# LLM을 위한 Streamlit 환경 구성

## Cloud9 실행환경

[Cloud9 console](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/)에서 [Create environment]를 선택하여 Cloud9을 생성합니다.

Cloud9 생성후 아래처럼 streamlit을 설치합니다.

```text
pip install streamlit
```

Cloud9이 설치된 EC2를 찾아서 Security Group의 inbound rule에서 8501을 Open합니다.

![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/1a451dd0-92d3-465e-80e2-144c0fa65d8b)

streamlit을 실행합니다.

```text
streamlit run hello.py
```

Collecting usage statistics. To deactivate, set browser.gatherUsageStats to False.

아래와 같은 결과가 나오면 밑의 External URL을 브라우저를 이용해 접속합니다.

```text
  You can now view your Streamlit app in your browser.

  Network URL: http://172.31.46.12:8501
  External URL: http://3.39.22.83:8501
```

이후, hello.py를 열어서 작업을 한 후에 저정하면 됩니다. 결과 업데이트는 브라우저를 reflash하면 됩니다.

## 예제

title, head, subheader는 아래와 같이 사용합니다.

```python
st.title('this is title')
st.header('this is header')
st.subheader('this is subheader')
```

이때의 결과는 아래와 같습니다.

![image](https://github.com/kyopark2014/LLM-streamlit/assets/52392004/e0f94a88-8f58-4ebd-9e5f-966085621114)

## 입력창

```python
input_text = st.text_input('**Chat with me**', key='text')
```

## Reference 

[Github - Welcome to Streamlit](https://github.com/streamlit/streamlit)

[Streamlit cheat sheet](https://daniellewisdl-streamlit-cheat-sheet-app-ytm9sg.streamlit.app/)
