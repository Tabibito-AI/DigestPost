import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Settings, History, Zap, Play } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch user configurations
  const configsQuery = trpc.config.list.useQuery();
  const configs = configsQuery.data || [];

  // Manual execution mutation
  const executeMutation = trpc.manual.executePost.useMutation({
    onSuccess: (data) => {
      setExecutionResult(data);
      setMessage({ type: 'success', text: data.message });
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const handleManualExecution = async () => {
    if (!selectedConfigId) {
      setMessage({ type: 'error', text: '設定を選択してください' });
      return;
    }

    await executeMutation.mutateAsync({ configId: selectedConfigId });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20">
          {/* Hero Section */}
          <div className="text-center space-y-8 mb-20">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold">DigestPost</h1>
              <p className="text-xl md:text-2xl text-slate-300">
                AIが自動でニュースをキュレーションし、Xに投稿
              </p>
            </div>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              CNN、BBC、Bloombergなどの有名メディアから最新ニュースを自動取得。
              AIが要約を生成し、5時間ごとにあなたのXアカウントに自動投稿します。
            </p>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
            >
              ログインして始める
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                <CardTitle className="text-white">自動スクレイピング</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                CNN、BBC、Bloombergなどの有名メディアから自動的にニュースを取得します。
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Settings className="w-8 h-8 text-blue-400 mb-2" />
                <CardTitle className="text-white">AI生成コンテンツ</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                Manus LLM APIが記事を要約し、AIが画像を生成します。
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <History className="w-8 h-8 text-green-400 mb-2" />
                <CardTitle className="text-white">自動投稿管理</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                5時間ごとに自動投稿。投稿履歴は管理画面で確認できます。
              </CardContent>
            </Card>
          </div>

          {/* How it works */}
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
            <h2 className="text-2xl font-bold mb-6">使い方</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">ログイン</h3>
                  <p className="text-slate-400">Manus OAuth でログインします</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">X APIキーを設定</h3>
                  <p className="text-slate-400">設定ページでX (Twitter) のAPIキーを入力します</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">自動投稿開始</h3>
                  <p className="text-slate-400">5時間ごとにニュースが自動投稿されます</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">履歴確認</h3>
                  <p className="text-slate-400">投稿履歴ページで過去の投稿を確認できます</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">ようこそ、{user?.name}さん</h1>
          <p className="text-muted-foreground mt-2">
            DigestPostへようこそ。自動ニュース投稿を管理してください。
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Manual Execution Section */}
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              手動でニュースを投稿
            </CardTitle>
            <CardDescription>
              設定を選択して、即座にニュース取得からX投稿まで実行できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configuration Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">投稿設定を選択</label>
              {configsQuery.isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : configs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {configs.map((config) => (
                    <Button
                      key={config.id}
                      variant={selectedConfigId === config.id ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setSelectedConfigId(config.id as number)}
                      disabled={!config.isActive}
                    >
                      <div className="text-left">
                        <p className="font-semibold">設定ID: {config.id}</p>
                        <p className="text-xs">
                          {config.isActive ? "有効" : "無効"}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  設定がまだ登録されていません。設定ページで登録してください。
                </p>
              )}
            </div>

            {/* Execute Button */}
            <Button
              onClick={handleManualExecution}
              disabled={!selectedConfigId || executeMutation.isPending || configs.length === 0}
              size="lg"
              className="w-full"
            >
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  今すぐ投稿実行
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Execution Result */}
        {executionResult && (
          <Card>
            <CardHeader>
              <CardTitle>投稿結果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tweet Text */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  投稿内容
                </p>
                <p className="text-base whitespace-pre-wrap">
                  {executionResult.tweet.text}
                </p>
              </div>

              {/* Tweet Image */}
              {executionResult.tweet.imageUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    生成画像
                  </p>
                  <img
                    src={executionResult.tweet.imageUrl}
                    alt="Generated tweet image"
                    className="max-w-full h-auto rounded-lg max-h-64"
                  />
                </div>
              )}

              {/* Source Information */}
              <div className="border-t pt-4 space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    ニュースソース
                  </p>
                  <p className="text-sm">{executionResult.tweet.sourceMedia}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    記事タイトル
                  </p>
                  <p className="text-sm line-clamp-2">
                    {executionResult.tweet.sourceTitle}
                  </p>
                </div>
                <a
                  href={executionResult.tweet.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  元の記事を読む →
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>設定を管理</CardTitle>
              <CardDescription>
                X APIキーを登録して自動投稿を開始
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/settings">
                <Button className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  設定ページへ
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>投稿履歴を確認</CardTitle>
              <CardDescription>
                過去に投稿されたツイートを確認
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/history">
                <Button className="w-full">
                  <History className="w-4 h-4 mr-2" />
                  履歴ページへ
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>DigestPostについて</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">機能</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• CNN、BBC、Bloombergなどの有名メディアから自動的にニュースを取得</li>
                <li>• Manus LLM APIを使用した高度な記事要約</li>
                <li>• AI画像生成で視覚的に魅力的なツイートを作成</li>
                <li>• 5時間ごとの自動投稿スケジュール</li>
                <li>• 手動実行機能で即座にニュースを投稿</li>
                <li>• 投稿履歴の管理と確認</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">技術スタック</h3>
              <p className="text-sm text-muted-foreground">
                Next.js + React + TypeScript + Express + PostgreSQL + Manus LLM API
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
