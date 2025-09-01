import React, { useState, useEffect } from 'react';  
import {validateCode, formatResponse, createReview} from './functions';
import './App.css';
import { OpenAI } from 'openai';
import Tesseract from 'tesseract.js'
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import tomorrow from 'react-syntax-highlighter/dist/esm/styles/prism/tomorrow';

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, //In production, you would use a backend to make the API calls, since now the API key can be seen by the client, 
  //but this project is for demonstration purposes only.
})

function SubmitButton(){
  return(
    <button type="submit">Submit Code</button>
  );
}
function Loadingsymbol() {
  return (
    <div className="spinner">
      </div>
  );
}

function CustomInput({value, disabled, onChange}: {value: string, disabled? : boolean, onChange: (value: string) => void}) {
  return(
    <textarea rows = {20} cols = {100} 
    placeholder = "Paste your code here..."
    value = {value}
    disabled = {disabled}
    onChange = {e=> onChange(e.target.value)}></textarea>
  );
} 
function FileUpload({onChange}: {onChange: (file: File | null) => void}) {
  return (
    <input
      type = "file"
      accept = "image/*"
      onChange = {e => {
        const file = e.target.files ? e.target.files[0]: null;
        if (file){
          onChange(file);
        }
        else{
          onChange(null);
        }
      }
    }
          />
  );
}

function App() {
  const [code, setCode] = useState<string>('');
  const [result, setResult] = useState<boolean>(false);
  const [review, setReview] = useState<string>('');
  const [loading, setLoad] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('Python');
  const [image, setImage] = useState<File | null>(null);
  const [codefromImage, setCodefromImage] = useState<string>('');

  useEffect(() => {
    if(code.trim()!== ""){
      setImage(null);}
    },
    [code]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitted code:", code);
    if (image) {
      try {
        setLoad(true);
        // OCR progressing on image to extract text-new information
        const result = await Tesseract.recognize(image, 'eng')
        const text = result.data.text;
        setCodefromImage(text);
        console.log("Extracted text from image:", text);
        const response = await client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{role: "system", content: `You are a helpful AI assistant that reviews ${language} code and provides feedback.`},
                    {role: "user", content: `Please review the following ${language} code extracted from an image and provide feedback:\n\n${text}`}
          ],
          max_tokens : 500
        })
        const content = response.choices[0]?.message?.content ?? '';
        if(!content || content.trim() === "") {
          throw new Error("We are having trouble processing the image. Please try again.");
        }
        const aiReview = formatResponse(content);
        const reviewObject = createReview(text, aiReview);
        setResult(true);
        setReview(reviewObject.response);
        setLoad(false);
      } catch (error) {
        console.error("Error during image processing or API call:", error);
        setLoad(false);
        setResult(false); 
        setReview("An error occurred while processing your request. Please try again later.");
      }
    }
    else {
        if(!validateCode(code)){
      setResult(false);
      setReview("Invalid code input. Please enter valid Python code.");
      return;
    }
    setCodefromImage(code);
    try {
      setLoad(true);
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{role: "system", content: `You are a helpful AI assistant that reviews ${language} code and provides feedback.`},
                  {role: "user", content: `Please review the following ${language} code and provide feedback:\n\n${code}`}
        ],
        max_tokens : 500});
      const content = response.choices[0]?.message?.content?? '';
      if(! content || content.trim() === ""){
        throw new Error("Empty response from AI");
      }
      const aiReview = formatResponse(content);
      const reviewObject = createReview(code, aiReview);
      setResult(true);
      setReview(reviewObject.response);
      setLoad(false);

      } catch(error){
        console.error("Error during API call:", error);
        setLoad(false);
        setResult(false); 
        setReview("An error occurred while processing your request. Please try again later.");
      }
    }
  };



  return (
    <div className="App">
      <header>
        <h1>AI Coding Assistant</h1>
        <p>Get instant feedback on your code</p>
      </header>
      
      <main>
        <h2>Ready when you are...</h2>
        
        <form onSubmit={handleSubmit}>
          <CustomInput value = {code} onChange = {setCode} disabled = {loading}/>
          <br />
          <FileUpload onChange = {setImage} />
          {loading ? <Loadingsymbol/> : <SubmitButton />}
          <br />
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="Python">Python</option>
            <option value="C++">C++</option>
            <option value="Java">Java</option>
            <option value="JavaScript">JavaScript</option>
          </select>
        </form>
        {result && (
          <div className = "results">
            <h3> After Evaluation </h3>
            <h4> What you gave me: </h4>
            <div className="coding-block">
            <SyntaxHighlighter language = {language.toLowerCase()} style={tomorrow} showLineNumbers>
              {image ? codefromImage: code}
            </SyntaxHighlighter>
            </div>
            <ReactMarkdown>
              {review}
            </ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
}
export default App;