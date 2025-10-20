import { promises as fs } from 'fs';
import path from 'path';

interface FeedbackLogEntry {
  timestamp: string;
  news_check_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  news_content?: string;
  analysis_result?: any;
}

const FEEDBACK_LOG_PATH = path.join(process.cwd(), 'feedback_log.json');

export async function logFeedbackToFile(feedbackData: FeedbackLogEntry): Promise<void> {
  try {
    const logEntry = {
      ...feedbackData,
      timestamp: new Date().toISOString(),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Append to file (create if doesn't exist)
    await fs.appendFile(FEEDBACK_LOG_PATH, logLine);
  } catch (error) {
    console.error('Error logging feedback to file:', error);
    // Don't throw error as this is optional logging
  }
}

export async function getFeedbackLogs(limit: number = 100): Promise<FeedbackLogEntry[]> {
  try {
    const data = await fs.readFile(FEEDBACK_LOG_PATH, 'utf-8');
    const lines = data.trim().split('\n').filter(line => line.length > 0);
    
    // Get last N lines
    const recentLines = lines.slice(-limit);
    
    return recentLines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('Error reading feedback logs:', error);
    return [];
  }
}

export async function exportFeedbackAsCSV(): Promise<string> {
  try {
    const logs = await getFeedbackLogs(1000); // Get up to 1000 recent entries
    
    if (logs.length === 0) {
      return 'timestamp,news_check_id,user_id,rating,comment\n';
    }

    const csvHeader = 'timestamp,news_check_id,user_id,rating,comment\n';
    const csvRows = logs.map(log => {
      const comment = log.comment ? log.comment.replace(/"/g, '""') : '';
      return `"${log.timestamp}",${log.news_check_id},${log.user_id},${log.rating},"${comment}"`;
    }).join('\n');

    return csvHeader + csvRows;
  } catch (error) {
    console.error('Error exporting feedback as CSV:', error);
    throw error;
  }
}
