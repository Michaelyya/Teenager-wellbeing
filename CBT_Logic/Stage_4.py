from CBT_ import ChatGPTResponseGenerator, ChatGPTDialogueSummarizer
import json
from openai import OpenAI
import os
from dotenv import load_dotenv
from pinecone import Pinecone
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)
from typing import List, Dict
from langchain.embeddings.openai import OpenAIEmbeddings
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Arrow
import re
import pandas as pd
import numpy as np
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import plotly.graph_objects as go



pc = Pinecone(api_key="6d5cdd0a-90b1-454c-bb02-57c80dac0797")
pinecone_index_name = "newadvice"
index = pc.Index(pinecone_index_name)
embed_model = OpenAIEmbeddings(openai_api_key=api_key)


 
class TherapyImplementationStage(ChatGPTResponseGenerator):
    def __init__(self):
        super().__init__(
            base_instruction="""
            if the user is in using Chinese, please give the response in Chinse as well. 
            There is the chat_history: {self.conversation_history}
Your role: You are a therapist implementing the chosen therapy approach for a teenager.
Your task:Use the retrieved advice and the specified therapy approach to generate a supportive and helpful response tailored to the teenager's situation. Adapt your approach based on the chosen therapy (CBT, DBT, or REBT).
Please always remember the patient is a teenager, who is 12-18 years old.

Guidelines:
- Adapt your approach based on the chosen therapy (CBT, DBT, or REBT).
- Incorporate the retrieved advice into your response, adapting it to the specific context of the conversation and the chosen therapy approach.
- Be empathetic and supportive in your language.
- Provide practical suggestions that the teenager can implement, based on the retrieved advice and therapy approach.
- Encourage the teenager to reflect on their thoughts and feelings.
- Ask for the teenager's opinion on the advice given, and be prepared to retrieve new advice if they're not satisfied.
Remember to tailor your responses to the specific needs and challenges of the teenager, as identified in the chat_history.
"""
        )
    def retrieve_advice(self, context: str, k: int = 2):
        query_embedding = embed_model.embed_query(context)
        results = index.query(vector=query_embedding, top_k=k, include_metadata=True)
        advice_list = []
        for match in results['matches']:
            score = match.get('score', 0)
            text = match['metadata'].get('text', 'No text available')
            id = match.get('id', 'No ID')
            advice_list.append((score, text, id))
        return advice_list

    def visualize_advice_scores(self, context: str, k: int = 10):
        advice_list = self.retrieve_advice(context, k)
        
        advice_list.sort(key=lambda x: int(x[2]))
        scores = [1 - score for score, _, _ in advice_list]  # Convert similarity to distance
        texts = [text for _, text, _ in advice_list]
        ids = [int(id) for _, _, id in advice_list]
        
        x = np.random.rand(len(scores))
        y = np.random.rand(len(scores))
        def split_text(text, max_len=50):
            if len(text) <= max_len:
                return text, ""
            
            words = text.split()
            mid = len(words) // 2
            return " ".join(words[:mid]), " ".join(words[mid:])
        # Create the 3D scatter plot
        texts = [split_text(text) for text in texts]

        fig = go.Figure(data=[go.Scatter3d(
            x=x,
            y=y,
            z=scores,
            mode='markers',
            marker=dict(
                size=10,
                color=scores,
                colorscale='Viridis',
                opacity=0.8
            ),
            text=[f"ID: {id}<br>Score: {1-score:.4f}<br>Text: {text}" for id, score, text in zip(ids, scores, texts)],
            hovertemplate=
            '<span style="font-size: 10px;">' +
            '<b>ID:</b> %{customdata[0]}<br>' +
            '<b>Score:</b> %{customdata[1]:.4f}<br>' +
            '<b>Text:</b> %{customdata[2]}<br>' +
            '%{customdata[3]}' +
            '</span>' +
            '<extra></extra>',
            customdata=list(zip(ids, [1-score for score in scores], 
                                [t[0] for t in texts], [t[1] for t in texts]))
        )])
        fig.update_layout(
            title='3D Visualization of Retrieved Advice Scores',
            scene=dict(
                xaxis_title='Teenager emotional rate',
                yaxis_title='',
                zaxis_title='Distance from Query (1 - Similarity Score)'
            ),
            width=900,
            height=700,
        )
        
        # Show the plot
        fig.show()
        
        # Print the advice texts sorted by ID
        print("Retrieved advice (sorted by ID):")
        for score, text, id in advice_list:
            print(f"ID: {id}, Score: {1-score:.4f}, Text: {text}")

    

    def process(self, user_input: str, conversation_history: List[Dict[str, str]], chosen_therapy: str) -> str:
        therapy_specific_instructions = {
            "CBT": "Focus on identifying and challenging negative thought patterns. Help the teenager develop more balanced and realistic thoughts.",
            "DBT": "Emphasize mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness skills.",
            "REBT": "Use the ABC model to identify and dispute irrational beliefs. Help the teenager develop more rational and flexible thinking."
        }
        context = " ".join([msg['content'] for msg in conversation_history[-5:]] + [user_input])
        retrieved_advice = self.retrieve_advice(context)

        prompt = f"{self.base_instruction}\n\nChosen Therapy: {chosen_therapy}\n{therapy_specific_instructions[chosen_therapy]}n\nRetrieved Advice:\n"
        for advice in retrieved_advice:
            prompt += f"- {advice}\n"
        prompt += f"\nConversation History:\n"
        for turn in conversation_history[-5:]:
            prompt += f"{turn['role'].capitalize()}: {turn['content']}\n"
        prompt += f"\nUser: {user_input}\n\nTherapist (incorporate the retrieved advice, apply the {chosen_therapy} approach, and ask for the teenager's opinion):"

        response = client.chat.completions.create(model="gpt-4o-mini",
        messages=[{"role": "system", "content": prompt}])

        return response.choices[0].message.content

class TherapyImplementationSummarizer(ChatGPTDialogueSummarizer):
    def __init__(self):
        super().__init__(
            base_instruction = """
        Given the following conversation history: {self.conversation_history}
        - Analyze the dialogue history to assess the progress of the advice implementation.
        - Evaluate the teenager's engagement with the provided advice and any changes in their perspective or emotional state.
        - Provide a structured JSON response with the following properties:

        (1) key_issues: List of main challenges or concerns addressed in the session.
        (2) provided_advice: Summary of the main advice or strategies suggested.
        (3) user_response: Assessment of how the teenager responded to the advice (e.g., receptive, hesitant, resistant).
        (4) observed_changes: Description of any positive changes or shifts in perspective noticed.
        (5) areas_for_focus: List of aspects that need more attention in future interactions.
        (6) continue_session: Boolean indicating whether to continue with more advice sessions.
        (7) retrieve_new_advice: Boolean indicating whether new advice should be retrieved.
        (8) rationale: Explanation for the assessment and the decision to continue or conclude.

        Guidelines for `continue_session`:
        - Set to `true` if the teenager still needs additional support and engagement.
        - Set to `false` if they have reached a stable resolution or if further engagement is unnecessary.

        Guidelines for `retrieve_new_advice`:
        - Set to `true` if the current advice was insufficient or if new approaches should be considered.
        - Set to `false` if the teenager is already making progress with the given advice.

        ### Example:

        #### Input:
        [
            {"role": "assistant", "content": "你觉得上次的建议对你有帮助吗？"},
            {"role": "user", "content": "我试着按照你的建议，每天写下自己的情绪，感觉有点帮助，但有时候还是会觉得很难过。"},
            {"role": "assistant", "content": "很棒的开始！你有没有发现自己的情绪有什么变化？"},
            {"role": "user", "content": "有时候会觉得好一些，但还是经常感到压力很大，特别是面对考试的时候。"}
        ]

        #### Output:
        {
            "key_issues": ["Emotional regulation", "Academic stress"],
            "provided_advice": "Encouraged the user to track their emotions daily to improve self-awareness.",
            "user_response": "Receptive but still experiencing emotional difficulties.",
            "observed_changes": "User has started journaling emotions and noticed some improvement but still struggles under stress.",
            "areas_for_focus": ["Managing stress during exams", "Developing additional coping strategies"],
            "continue_session": true,
            "retrieve_new_advice": true,
            "rationale": "The user has engaged with the advice and shown some progress, but they continue to struggle with academic stress. Additional guidance and coping strategies are needed."
        }
        """,
            gpt_params={"temperature": 0.1},
            dialogue_filter=lambda dialogue, _: dialogue[-5:]
        )

    def summarize(self, dialogue: List[Dict[str, str]], chosen_therapy: str) -> str:
        prompt = f"{self.base_instruction}\n\nChosen Therapy: {chosen_therapy}\n\nDialogue:\n"
        for turn in dialogue[-5:]:  # Consider last 5 turns
            prompt += f"{turn['role'].capitalize()}: {turn['content']}\n"
        prompt += "\nSummary:"
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": prompt}]
        )
        return response.choices[0].message.content
    


# therapy_implementation = TherapyImplementationStage()
# context = "I'm feeling really anxious about my upcoming exams"
# therapy_implementation.visualize_advice_scores(context, k=100) 
# print