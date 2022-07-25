use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod tweet {
    use super::*;

    pub fn create(ctx: Context<Create>) -> Result<()> {
        let tweet = &mut ctx.accounts.tweet;
        tweet.likes = 0;
        tweet.message = "".to_string();
        Ok(())
    }

    pub fn write(ctx: Context<Write>, message: String, user: Pubkey) -> Result<()> {
        let tweet = &mut ctx.accounts.tweet;

        if !tweet.message.trim().is_empty() {
            return err!(Errors::CannotUpdateTweet);
        }
        if message.trim().is_empty() {
            return err!(Errors::EmptyMessage);
        }
        
        tweet.message = message;
        tweet.likes = 0;
        tweet.creator = user;
        Ok(())
    }

    pub fn like(ctx: Context<Like>, user: Pubkey) -> Result<()> {
        let tweet = &mut ctx.accounts.tweet;

        if tweet.message.trim().is_empty() {
            return err!(Errors::NotValidTweet);
        }
        if tweet.likes == 10 {
            return err!(Errors::ReachedMaxLikes);
        }
        if tweet.people_who_liked.iter().any(|&x| x == user) {
            return err!(Errors::UserLikedTweet);
        }

        tweet.likes += 1;
        tweet.people_who_liked.push(user);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init, payer=user, space=9000)]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Write<'info> {
    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
}

#[derive(Accounts)]
pub struct Like<'info> {
    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
}

#[account]
pub struct Tweet {
    message: String,
    likes: u8,
    creator: Pubkey,
    people_who_liked: Vec<Pubkey>,
}

#[error_code]
pub enum Errors {
    #[msg("Tweet message cannot be updated")]
    CannotUpdateTweet,
    #[msg("Message cannot be empty")]
    EmptyMessage,
    #[msg("Cannot like a tweet without a valid message")]
    NotValidTweet,
    #[msg("Cannot receive more than 5 likes")]
    ReachedMaxLikes,
    #[msg("User has already liked the tweet")]
    UserLikedTweet,
}