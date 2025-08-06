/*
 * @Author: Copilot
 * @Date: 2025-01-01 00:00:00
 * @Description: AI评论管理页面
 */
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Progress, message, Typography, Space, Divider } from 'antd';
import { RobotOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';
import './AiCommentManager.module.scss';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface CommentProgress {
  status: string;
  progress: number;
  message?: string;
  result?: string;
  error?: string;
}

const AiCommentManager: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string>('');
  const [progress, setProgress] = useState<CommentProgress | null>(null);
  const [result, setResult] = useState<string>('');

  // 轮询检查进度
  useEffect(() => {
    if (!taskId) return;

    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/tools/ai/comment/progress/${taskId}`);
        const data = await response.json();
        setProgress(data);

        if (data.status === 'completed' && data.result) {
          setResult(data.result);
          setLoading(false);
        } else if (data.status === 'error') {
          message.error(data.error || '生成失败');
          setLoading(false);
        }
      } catch (error) {
        console.error('获取进度失败:', error);
      }
    };

    const interval = setInterval(checkProgress, 1000);

    return () => clearInterval(interval);
  }, [taskId]);

  const onFinish = async (values: any) => {
    setLoading(true);
    setResult('');
    setProgress(null);
    
    try {
      const response = await fetch('/api/tools/ai/comment/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const taskId = await response.text();
        setTaskId(taskId.replace(/"/g, '')); // 移除引号
        message.success('AI评论生成已开始，请稍候...');
      } else {
        throw new Error('请求失败');
      }
    } catch (error) {
      message.error('生成失败，请重试');
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setResult('');
    setProgress(null);
    setTaskId('');
    setLoading(false);
  };

  const getProgressColor = () => {
    if (progress?.status === 'error') return '#ff4d4f';
    if (progress?.status === 'completed') return '#52c41a';
    return '#1890ff';
  };

  return (
    <div className="ai-comment-manager">
      <Card
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>AI评论管理</Title>
          </Space>
        }
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={resetForm}
            disabled={loading}
          >
            重置
          </Button>
        }
        style={{ margin: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
        >
          <Form.Item
            label="评论主旨"
            name="content"
            rules={[{ required: true, message: '请输入评论主旨' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入需要评论的内容主旨，例如：这是一个关于科技的视频..."
            />
          </Form.Item>

          <Form.Item
            label="自定义提示词（可选）"
            name="customPrompt"
            tooltip="可以自定义AI的回复风格和要求"
          >
            <TextArea
              rows={2}
              placeholder="例如：请以幽默风趣的语调进行评论，字数控制在30字以内..."
            />
          </Form.Item>

          <Form.Item label="作品标题（可选）" name="title">
            <Input placeholder="请输入作品标题" />
          </Form.Item>

          <Form.Item label="作品描述（可选）" name="desc">
            <Input placeholder="请输入作品描述" />
          </Form.Item>

          <Form.Item label="最大字数" name="max" initialValue={50}>
            <Input type="number" placeholder="评论最大字数" min={10} max={200} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
              size="large"
              block
            >
              生成AI评论
            </Button>
          </Form.Item>
        </Form>

        {/* 进度显示 */}
        {progress && (
          <Card 
            title="生成进度" 
            size="small" 
            style={{ marginTop: 16 }}
          >
            <Progress
              percent={progress.progress}
              status={progress.status === 'error' ? 'exception' : progress.status === 'completed' ? 'success' : 'active'}
              strokeColor={getProgressColor()}
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              {progress.message || '正在处理...'}
            </Text>
          </Card>
        )}

        {/* 结果显示 */}
        {result && (
          <>
            <Divider />
            <Card 
              title="生成结果" 
              size="small"
              extra={
                <Button
                  size="small"
                  onClick={() => navigator.clipboard.writeText(result)}
                >
                  复制
                </Button>
              }
            >
              <div className="result-content">
                <Text>{result}</Text>
              </div>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default AiCommentManager;
