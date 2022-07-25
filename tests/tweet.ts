import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { Tweet } from "../target/types/tweet";

describe("tweet", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Tweet as Program<Tweet>;
  const tweetAccount = anchor.web3.Keypair.generate();

  it("Create a tweet", async () => {
    await program.methods.create().accounts({
      tweet: tweetAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([tweetAccount]).rpc();
    const account = await program.account.tweet.fetch(tweetAccount.publicKey);
    assert.ok(account.likes === 0);
    assert.ok(account.message === "");
  });

  it("Write a tweet", async () => {
    await program.methods.write("Hello World", provider.wallet.publicKey).accounts({
      tweet: tweetAccount.publicKey,
    }).rpc();
    const account = await program.account.tweet.fetch(tweetAccount.publicKey);
    assert.ok(account.likes === 0);
    assert.ok(account.message === "Hello World");
    assert.ok(account.creator.equals(provider.wallet.publicKey));
  });

  it("Like a tweet", async () => {
    await program.methods.like(provider.wallet.publicKey).accounts({
      tweet: tweetAccount.publicKey,
    }).rpc();
    const account = await program.account.tweet.fetch(tweetAccount.publicKey);
    assert.ok(account.likes === 1);
    assert.ok(account.peopleWhoLiked[0].equals(provider.wallet.publicKey));
  });

  it("Error Test: UserLikedTweet", async () => {
    try {
      await program.methods.like(provider.wallet.publicKey).accounts({
        tweet: tweetAccount.publicKey,
      }).rpc();
    } catch (error) {
      assert.ok(error.error.errorMessage === "User has already liked the tweet");
    }
  });

  it("Error Test: ReachedMaxLikes", async () => {
      for (let i = 0; i < 5; i++) {
        const user = anchor.web3.Keypair.generate();
        await program.methods.like(user.publicKey).accounts({
          tweet: tweetAccount.publicKey,
        }).rpc();
      }

      const rejectedUser = anchor.web3.Keypair.generate();
      try {
        await program.methods.like(rejectedUser.publicKey).accounts({
          tweet: tweetAccount.publicKey,
        }).rpc();
      } catch (error) {
        assert.ok(error.error.errorMessage === "Cannot receive more than 5 likes");
      }
  });
});
