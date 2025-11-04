import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function History() {
  const { user } = useAuth();
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch user configurations
  const configsQuery = trpc.config.list.useQuery();
  const configs = configsQuery.data || [];

  // Fetch posted tweets
  const tweetsQuery = trpc.tweets.list.useQuery(
    selectedConfigId
      ? {
          configId: selectedConfigId,
          limit: itemsPerPage,
          offset: (page - 1) * itemsPerPage,
        }
      : { configId: 0, limit: itemsPerPage, offset: 0 },
    { enabled: !!selectedConfigId }
  );

  const tweets = tweetsQuery.data || [];

  // Fetch total count
  const countQuery = trpc.tweets.count.useQuery(
    selectedConfigId ? { configId: selectedConfigId } : { configId: 0 },
    { enabled: !!selectedConfigId }
  );

  const totalCount = countQuery.data || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">投稿履歴</h1>
          <p className="text-muted-foreground mt-2">
            自動投稿されたツイートの履歴を確認してください
          </p>
        </div>

        {/* Configuration Selector */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">設定を選択</h2>
          {configsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : configs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.map((config) => (
                <Button
                  key={config.id}
                  variant={selectedConfigId === config.id ? "default" : "outline"}
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => {
                    setSelectedConfigId(config.id as number);
                    setPage(1);
                  }}
                >
                  <div>
                    <p className="font-semibold">設定ID: {config.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.isActive ? "有効" : "無効"}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  設定がまだ登録されていません
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tweets List */}
        {selectedConfigId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">投稿済みツイート</h2>
              <p className="text-sm text-muted-foreground">
                全 {totalCount} 件
              </p>
            </div>

            {tweetsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : tweets.length > 0 ? (
              <div className="space-y-4">
                {tweets.map((tweet) => (
                  <Card key={tweet.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Tweet Text */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            ツイート内容
                          </p>
                          <p className="text-base whitespace-pre-wrap">
                            {tweet.tweetText}
                          </p>
                        </div>

                        {/* Tweet Image */}
                        {tweet.imageUrl && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              画像
                            </p>
                            <img
                              src={tweet.imageUrl}
                              alt="Tweet image"
                              className="max-w-full h-auto rounded-lg max-h-64"
                            />
                          </div>
                        )}

                        {/* Source Information */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              ニュースソース
                            </p>
                            <p className="text-sm">{tweet.sourceMedia}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              投稿日時
                            </p>
                            <p className="text-sm">
                              {new Date(tweet.postedAt).toLocaleString("ja-JP")}
                            </p>
                          </div>
                        </div>

                        {/* Source Title */}
                        {tweet.sourceTitle && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              記事タイトル
                            </p>
                            <p className="text-sm line-clamp-2">
                              {tweet.sourceTitle}
                            </p>
                          </div>
                        )}

                        {/* Source Link */}
                        <div>
                          <a
                            href={tweet.sourceNewsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            元のニュース記事を読む
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      前へ
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      次へ
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    まだツイートが投稿されていません
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
