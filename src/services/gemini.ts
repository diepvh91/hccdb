import { GoogleGenAI, Modality } from "@google/genai";

export async function generateSpeech(text: string) {
  try {
    const ttsApiKey = process.env.GEMINI_API_KEY || "";
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${ttsApiKey}`;
    const response = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "vi-VN",
          name: "vi-VN-Standard-A",
          ssmlGender: "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.1,
          pitch: 0,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Google Cloud TTS error:", err);
      return null;
    }

    const data = await response.json();
    if (!data.audioContent) {
      console.error("Google Cloud TTS: no audio content");
      return null;
    }

    console.log("Google Cloud TTS: audio generated, size:", data.audioContent.length);
    return data.audioContent;
  } catch (error) {
    console.error("Speech Generation Error:", error);
    return null;
  }
}

export async function* getChatResponseStream(message: string, trainingContext: string, knowledgeBase: string = "", unitName: string = "Đơn vị") {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";

    console.log("🔧 Chat API Call Debug:");
    console.log(`   - API Key: ${apiKey ? `✅ Có (${apiKey.substring(0, 10)}...)` : "❌ KHÔNG CÓ"}`);
    console.log(`   - Unit: ${unitName}`);
    console.log(`   - Message: ${message.substring(0, 50)}...`);
    console.log(`   - Training Context: ${trainingContext ? "✅ Có" : "❌ KHÔNG CÓ"}`);
    console.log(`   - Knowledge Base: ${knowledgeBase ? `✅ Có (${knowledgeBase.length} chars)` : "❌ KHÔNG CÓ"}`);

    if (!apiKey) {
      throw new Error("❌ GEMINI_API_KEY không được cấu hình! Kiểm tra file .env.local");
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";

    console.log("📊 Using model:", model);

    const parts: any[] = [
      { text: message }
    ];

    let kbText = knowledgeBase;
    if (kbText.length > 500000) {
      kbText = kbText.substring(0, 500000) + "\n\n[... tài liệu đã được cắt bớt do quá dài ...]";
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
- Bạn PHẢI trả lời dựa trên "Nội dung huấn luyện" và "Tài liệu thủ tục hành chính" được cung cấp bên dưới.
- Nếu thông tin có trong tài liệu, hãy ưu tiên sử dụng nó.

NỘI DUNG HUẤN LUYỆN RIÊNG BIỆT CỦA ĐƠN VỊ:
---
${trainingContext || "Không có nội dung huấn luyện đặc thù."}
---

TÀI LIỆU THỦ TỤC HÀNH CHÍNH:
---
${kbText || "Không có tài liệu."}
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

export async function getChatResponse(message: string, trainingContext: string, knowledgeBase: string = "", unitName: string = "Đơn vị") {
  let fullText = "";
  const stream = getChatResponseStream(message, trainingContext, knowledgeBase, unitName);
  for await (const chunk of stream) {
    fullText += chunk;
  }
  return fullText;
}
