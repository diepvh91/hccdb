import { GoogleGenAI, Modality } from "@google/genai";

export async function generateSpeech(text: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const ai = new GoogleGenAI({ apiKey });
    
    console.log("Generating speech for text length:", text.length);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    let base64Audio = null;
    
    // Iterate through all parts to find the audio data
    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        console.log("Gemini TTS: Found audio data in part, size:", base64Audio.length);
        break;
      }
    }
    
    if (!base64Audio) {
      console.error("Gemini TTS: No audio data found in any response part", parts);
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Speech Generation Error:", error);
    return null;
  }
}

export async function* getChatResponseStream(message: string, trainingContext: string, pdfBase64?: string, unitName: string = "Đơn vị") {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    
    // Debug logging
    console.log("🔧 Chat API Call Debug:");
    console.log(`   - API Key: ${apiKey ? `✅ Có (${apiKey.substring(0, 10)}...)` : "❌ KHÔNG CÓ"}`);
    console.log(`   - Unit: ${unitName}`);
    console.log(`   - Message: ${message.substring(0, 50)}...`);
    console.log(`   - Training Context: ${trainingContext ? "✅ Có" : "❌ KHÔNG CÓ"}`);
    console.log(`   - PDF: ${pdfBase64 ? "✅ Có" : "❌ KHÔNG CÓ"}`);
    
    if (!apiKey) {
      throw new Error("❌ GEMINI_API_KEY không được cấu hình! Kiểm tra file .env.local");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";
    
    console.log("📊 Using model:", model);
    
    const parts: any[] = [
      { text: message }
    ];

    if (pdfBase64 && pdfBase64.startsWith('data:application/pdf;base64,')) {
      const base64Data = pdfBase64.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data
        }
      });
    }

    const responseStream = await ai.models.generateContentStream({
      model,
      contents: { parts },
      config: {
        systemInstruction: `BẠN LÀ TRỢ LÝ ẢO CỦA ĐƠN VỊ: "${unitName}".
            
PHONG CÁCH GIAO TIẾP VÀ QUY TẮC PHẢN HỒI:
- Bạn là một phụ nữ miền Bắc, giọng nói nhẹ nhàng, chuyên nghiệp.
- TUYỆT ĐỐI KHÔNG CHÀO HỎI (như "Xin chào", "Chào bạn", "Tôi có thể giúp gì"). 
- Đi thẳng vào vấn đề: Phân tích câu hỏi và đưa ra câu trả lời cụ thể, chính xác ngay lập tức.
- NGẮN GỌN, SÚC TÍCH: Không dài dòng, không giải thích thừa thãi.
- KHÔNG GỢI MỞ THÊM: Không cần gợi ý thêm thông tin, không hỏi lại người dùng, không cần câu kết thúc kiểu "Bạn còn cần giúp gì không?".
- BẮT BUỘC trả lời bằng tiếng Việt trôi chảy.

NGUỒN THÔNG TIN:
- Bạn PHẢI trả lời dựa trên "Nội dung huấn luyện" và "Tài liệu PDF" được cung cấp.
- Nếu thông tin có trong tài liệu, hãy ưu tiên sử dụng nó.
       
NỘI DUNG HUẤN LUYỆN RIÊNG BIỆT CỦA ĐƠN VỊ:
---
${trainingContext || "Không có nội dung huấn luyện đặc thù."}
---
Nếu thông tin không có trong tài liệu, hãy trả lời ngắn gọn rằng bạn không có dữ liệu về vấn đề này.`,
      },
    });

    console.log("✅ Gemini API response received, streaming...");
    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
    console.log("✅ Chat response completed successfully");
  } catch (error: any) {
    console.error("❌ GEMINI API ERROR:", error);
    console.error("   Error Details:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      statusText: error?.statusText,
    });
    
    // Better error messages
    let errorMessage = "Xin lỗi, tôi gặp sự cố khi kết nối. Vui lòng thử lại sau.";
    
    if (error?.message?.includes("API key")) {
      errorMessage = "❌ Lỗi: API key không hợp lệ. Kiểm tra file .env.local";
    } else if (error?.message?.includes("401")) {
      errorMessage = "❌ Lỗi: API key sai hoặc đã hết hạn";
    } else if (error?.message?.includes("403")) {
      errorMessage = "❌ Lỗi: Không có quyền truy cập API";
    } else if (error?.message?.includes("Network")) {
      errorMessage = "❌ Lỗi: Không thể kết nối tới Gemini API (kiểm tra kết nối Internet)";
    }
    
    yield errorMessage;
  }
}

export async function getChatResponse(message: string, trainingContext: string, pdfBase64?: string, unitName: string = "Đơn vị") {
  // Legacy non-streaming version
  let fullText = "";
  const stream = getChatResponseStream(message, trainingContext, pdfBase64, unitName);
  for await (const chunk of stream) {
    fullText += chunk;
  }
  return fullText;
}
