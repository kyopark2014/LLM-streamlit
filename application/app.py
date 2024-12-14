import streamlit as st 
import boto3
import json
import uuid
from streamlit_chat import message

st.set_page_config(layout="wide")
st.title("Welcome to AWS Multi-modal RAG Demo!") 

st.markdown('''- 이 데모는 검색 증강 생성 (RAG)을 활용한 생성형 AI 애플리케이션을 빠르게 구성하고 테스트해볼 수 있도록 간단한 챗봇 형태로 제공됩니다.''')
st.markdown('''- 복잡하게 느껴질 수 있는 RAG 구성, 예를 들면 VectorStore Embedding 작업부터 Amazon OpenSearch 클러스터 생성 및 문서 인덱싱, Bedrock 세팅까지 모든 작업을 템플릿으로 자동화함으로써 한 번의 CDK 배포만으로도 RAG 개발 및 테스트를 하고싶은 누구든 빠르게 활용할 수 있도록 돕는 것을 목표로 하고 있습니다.''')
st.markdown('''- [Github](https://github.com/aws-samples/kr-tech-blog-sample-code/cdk_bedrock_rag_chatbot/)에서 코드를 확인하실 수 있습니다.''')

st.markdown(
    """
    ### :red[Note] 
    - 이것은 Bedrock titan 테스트용 streamlit page 입니다.
    """)

#st.write("**Instructions:** \n - Type your query in the search bar \n - Only last five chats displayed for brevity \n")
st.write("**Instructions:** \n - Type your query in the search bar \n")
input_text = st.text_input('**Chat with me**', key='text')

def GetAnswers(query):
    if query == "cancel":
        answer = 'It was swell chatting with you. Goodbye for now'
        
    client = boto3.client("bedrock-runtime")
    system = [{ "text": "You are a helpful assistant" }]
    messages = [
        {"role": "user", "content": [{"text": "Write a short story about dragons"}]},
    ]

    inf_params = {"maxTokens": 300, "topP": 0.1, "temperature": 0.3}

    additionalModelRequestFields = {
        "inferenceConfig": {
            "topK": 20
        }
    }

    model_response = client.converse(
        modelId="us.amazon.nova-lite-v1:0", 
        messages=messages, 
        system=system, 
        inferenceConfig=inf_params,
        additionalModelRequestFields=additionalModelRequestFields
    )

    print("\n[Full Response]")
    print(json.dumps(model_response, indent=2))

    print("\n[Response Content Text]")
    print(model_response["output"]["message"]["content"][0]["text"])
    
    answer = model_response["output"]["message"]["content"][0]["text"]

    return answer  

p_summary = ''
if input_text != '':
    message(input_text, is_user=True, key=str(uuid.uuid4()))
    #if st.session_state.prevText is not None:
    #    result = GetAnswers(f'Answer from this text if the question is related to this text. Otherwise answer the question directly without referring to this text: {str(st.session_state.prevText)} {input_text}')
    #else:
    result = GetAnswers(input_text)
    
    result = result.replace("$","\$")
    st.session_state.prevText = result
    message(result, key=str(uuid.uuid4()))

    #st.session_state.count = int(st.session_state.count) + 1
    #p_text = call_bedrock_titan('Generate three prompts to query the text: '+ result)
    #p_text1 = []
    #p_text2 = ''
    #if p_text != '':
    #    p_text.replace("$","USD")
    #    p_text1 = p_text.split('\n')
    #    for i,t in enumerate(p_text1):
    #        if i > 1:
    #            p_text2 += t.split('\n')[0]+'\n\n'
    #    p_summary = p_text2
    #st.sidebar.markdown('### Suggested prompts for further insights \n\n' + p_summary)
    

# col1, col2, col3 = st.columns([1, 1, 1])
# with col1:
#     btn1 = st.button("👉 **이 RAG의 아키텍처를 보여주세요.**")
# with col2:
#     btn2 = st.button("👉 **이 애플리케이션의 UI는 어떻게 만들어졌나요?**")

# if "messages" not in st.session_state:
#     st.session_state["messages"] = [
#         {"role": "assistant", "content": "안녕하세요, 무엇이 궁금하세요?"}
#     ]
# # 지난 답변 출력
# for msg in st.session_state.messages:
#     st.chat_message(msg["role"]).write(msg["content"])

# if btn1:
#     query = "이 RAG의 아키텍처를 보여주세요."
#     st.chat_message("user").write(query)
#     st.chat_message("assistant").image('architecture.png')

#     st.session_state.messages.append({"role": "user", "content": query}) 
#     st.session_state.messages.append({"role": "assistant", "content": "아키텍처 이미지를 다시 확인하려면 위 버튼을 다시 눌러주세요."})

# if btn2:
#     query = "이 애플리케이션의 UI는 어떻게 만들어졌나요?"
#     answer = '''이 챗봇은 [Streamlit](https://docs.streamlit.io/)을 이용해 만들어졌어요.   
#                 Streamlit은 간단한 Python 기반 코드로 대화형 웹앱을 구축 가능한 오픈소스 라이브러리입니다.    
#                 아래 app.py 코드를 통해 Streamlit을 통해 간단히 챗봇 데모를 만드는 방법에 대해 알아보세요:
#                 💁‍♀️ [app.py 코드 확인하기](https://github.com/aws-samples/kr-tech-blog-sample-code/cdk_bedrock_rag_chatbot/application/streamlit.py)
#             '''
#     st.chat_message("user").write(query)
#     st.chat_message("assistant").write(answer)
    
#     st.session_state.messages.append({"role": "user", "content": query}) 
#     st.session_state.messages.append({"role": "assistant", "content": answer})

# # 유저가 쓴 chat을 query라는 변수에 담음
# query = st.chat_input("Search documentation")
# if query:
#     # Session에 메세지 저장
#     st.session_state.messages.append({"role": "user", "content": query})
    
#     # UI에 출력
#     st.chat_message("user").write(query)

#     # UI 출력
#     #answer = bedrock.query(query)
#     #st.chat_message("assistant").write(answer)

#     # Session 메세지 저장
#     st.session_state.messages.append({"role": "assistant", "content": answer})
        