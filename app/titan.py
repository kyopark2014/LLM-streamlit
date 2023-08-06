import os
import sys
import json
import boto3
import uuid
import streamlit as st
from streamlit_chat import message

module_path = "."
sys.path.append(os.path.abspath(module_path))

from utils import bedrock

def call_bedrock_titan(prompt_text, max_token_count=1024, temperature=1, top_p=1, stop_sequences=[]):
    bedrock_region = "us-west-2" 
    bedrock_config = {
        "region_name":bedrock_region,
        "endpoint_url":"https://prod.us-west-2.frontend.bedrock.aws.dev"
    }
    
    boto3_bedrock = bedrock.get_bedrock_client(
        region=bedrock_config["region_name"],
        url_override=bedrock_config["endpoint_url"])
        
    modelInfo = boto3_bedrock.list_foundation_models()    
    print('models: ', modelInfo)


    model_id = "amazon.titan-tg1-large"
    body_string = "{\"inputText\":\"" + f"{prompt_text}" +\
                    "\",\"textGenerationConfig\":{" +\
                    "\"maxTokenCount\":" + f"{max_token_count}" +\
                    ",\"temperature\":" + f"{temperature}" +\
                    ",\"topP\":" + f"{top_p}" +\
                    ",\"stopSequences\":" + f"{stop_sequences}" +\
                    "}}"
                    
    body = bytes(body_string, 'utf-8')
    response = boto3_bedrock.invoke_model(
        modelId = model_id,
        contentType = "application/json",
        accept = "application/json",
        body = body)
    response_lines = response['body'].readlines()
    json_str = response_lines[0].decode('utf-8')

    json_obj = json.loads(json_str)
    result_text = json_obj['results'][0]['outputText']
    return result_text


def GetAnswers(query):
    if query == "cancel":
        answer = 'It was swell chatting with you. Goodbye for now'
    
    #elif sentiment == 'NEGATIVE':
    #    answer = 'I do not answer questions that are negatively worded or that concern me at this time. Kindly rephrase your question and try again.'

    #elif query_type == "BEING":
    #    answer = 'Kindly rephrase your question keeping it impersonal and try again.'
            
    else:
        func = models[model.lower()]
        answer = func(query)   
    return answer  


# Streamlit 

st.set_page_config(page_title="Amazon Bedrock", page_icon="flashlight")

#st.markdown(
#    """
#    ### :red[Note] 
#    - For showcasing at large events please reach out to rangarap@ or dabounds@ for inputs
#    - Please review and comply with the [Generative AI Acceptable Use Policy](https://policy.a2z.com/docs/568686/publication)
#    - Use these selection of [samples for playing with the demos](https://amazon.awsapps.com/workdocs/index.html#/folder/085a7d2cc912f998468435fdf7eab6e9bb09ae855acfb9b16aea59de7d547e21).  
#    - The demos should not be considered as an actual prototype or working version of a proposed solution
#    - Source code available in the [GitLab repo](https://gitlab.aws.dev/dabounds/gen-ai-demos) and associated [Documentation](https://gitlab.aws.dev/dabounds/gen-ai-demos/-/tree/development/static/Documentation).
#    """)

st.markdown(
    """
    ### :red[Note] 
    - 이것은 Bedrock titan 테스트용 streamlit page 입니다.
    """)


st.sidebar.header("Bedrock Models")

fms = ['Bedrock Titan', 'Bedrock Claude 2', 'Bedrock Claude Instant', 'SageMaker Meta Llama-2-7b-chat', 'SageMaker Meta Llama-2-70b-chat', 'SageMaker Falcon']
default_model = fms.index('Bedrock Titan')


#st.title('this is title')
#st.header('this is header')
#st.subheader('this is subheader')


if 'sessionID' not in st.session_state:
    st.session_state['sessionID'] = str(uuid.uuid4())
if 'prevText' not in st.session_state:
    st.session_state['prevText'] = None
if 'count' not in st.session_state:
    st.session_state['count'] = 0
    

models = {
    "bedrock titan" : call_bedrock_titan,
}

model = ''
model = st.sidebar.selectbox(
    'Select a FM',
    options=fms, index=default_model)
st.markdown("# Chat with "+model)
    

#st.write("**Instructions:** \n - Type your query in the search bar \n - Only last five chats displayed for brevity \n")
st.write("**Instructions:** \n - Type your query in the search bar \n")
input_text = st.text_input('**Chat with me**', key='text')

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
